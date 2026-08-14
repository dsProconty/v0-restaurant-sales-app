"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ── Clientes ──────────────────────────────────────────────────────────────────

export async function getCxcClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cxc_clients")
    .select("*")
    .order("name")

  if (error) {
    console.error("[CxcClients] Error fetching clients:", error)
    return []
  }
  return data
}

export async function createCxcClient(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!name?.trim()) return { error: "El nombre es requerido" }

  console.log("[CxcClients] Creating client:", { name })
  const { data, error } = await supabase
    .from("cxc_clients")
    .insert({ name: name.trim(), phone, notes, is_active: true })
    .select()
    .single()

  if (error) {
    console.error("[CxcClients] Error creating client:", error)
    return { error: `Error al crear el cliente: ${error.message}` }
  }

  revalidatePath("/cxc")
  revalidatePath("/cxc/clients")
  return { success: true, client: data }
}

export async function updateCxcClient(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const notes = (formData.get("notes") as string) || null
  const is_active = formData.get("is_active") === "on"

  if (!name?.trim()) return { error: "El nombre es requerido" }

  const { error } = await supabase
    .from("cxc_clients")
    .update({ name: name.trim(), phone, notes, is_active })
    .eq("id", id)

  if (error) {
    console.error("[CxcClients] Error updating client:", error)
    return { error: "Error al actualizar el cliente" }
  }

  revalidatePath("/cxc")
  revalidatePath("/cxc/clients")
  return { success: true }
}

export async function deleteCxcClient(id: string) {
  const supabase = await createClient()

  console.log("[CxcClients] Deleting client:", id)
  const { error } = await supabase.from("cxc_clients").delete().eq("id", id)

  if (error) {
    console.error("[CxcClients] Error deleting client:", error)
    return { error: "Error al eliminar el cliente. Verifica que no tenga deudas registradas." }
  }

  revalidatePath("/cxc")
  revalidatePath("/cxc/clients")
  return { success: true }
}

// ── Productos (para el selector de items) ───────────────────────────────────────

export async function getActiveProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price")
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("[Cxc] Error fetching products:", error)
    return []
  }
  return data
}

// ── Deudas ────────────────────────────────────────────────────────────────────

export async function getCxcDebts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cxc_debts")
    .select("*, cxc_clients(id, name, phone), cxc_debt_items(*), cxc_payments(*)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("consumption_date", { ascending: false })

  if (error) {
    console.error("[CxcDebts] Error fetching debts:", error)
    return []
  }
  return data
}

export async function getCxcDebt(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cxc_debts")
    .select("*, cxc_clients(id, name, phone), cxc_debt_items(*), cxc_payments(*)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[CxcDebts] Error fetching debt:", error)
    return null
  }
  return data
}

interface DebtItemInput {
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
}

export async function createCxcDebt(payload: {
  client_id: string
  consumption_date: string
  due_date: string | null
  notes: string | null
  items: DebtItemInput[]
}) {
  const supabase = await createClient()

  if (!payload.client_id) return { error: "El cliente es requerido" }
  if (!payload.consumption_date) return { error: "La fecha de consumo es requerida" }
  if (!payload.items?.length) return { error: "Agrega al menos un producto consumido" }

  for (const item of payload.items) {
    if (!item.product_name?.trim()) return { error: "Cada producto necesita un nombre" }
    if (!item.quantity || item.quantity <= 0) return { error: "La cantidad debe ser mayor a 0" }
    if (item.unit_price < 0) return { error: "El precio no puede ser negativo" }
  }

  const total_amount = payload.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  console.log("[CxcDebts] Creating debt:", { client_id: payload.client_id, total_amount })

  const { data: debt, error: debtError } = await supabase
    .from("cxc_debts")
    .insert({
      client_id: payload.client_id,
      consumption_date: payload.consumption_date,
      due_date: payload.due_date,
      total_amount,
      notes: payload.notes,
    })
    .select()
    .single()

  if (debtError) {
    console.error("[CxcDebts] Error creating debt:", debtError)
    return { error: `Error al crear la deuda: ${debtError.message}` }
  }

  const itemRows = payload.items.map((item) => ({
    debt_id: debt.id,
    product_id: item.product_id,
    product_name: item.product_name.trim(),
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase.from("cxc_debt_items").insert(itemRows)

  if (itemsError) {
    console.error("[CxcDebts] Error creating debt items:", itemsError)
    await supabase.from("cxc_debts").delete().eq("id", debt.id)
    return { error: `Error al registrar los productos: ${itemsError.message}` }
  }

  revalidatePath("/cxc")
  revalidatePath("/cxc/aging")
  return { success: true, debt }
}

export async function deleteCxcDebt(id: string) {
  const supabase = await createClient()

  console.log("[CxcDebts] Deleting debt:", id)
  const { error } = await supabase.from("cxc_debts").delete().eq("id", id)

  if (error) {
    console.error("[CxcDebts] Error deleting debt:", error)
    return { error: "Error al eliminar la deuda" }
  }

  revalidatePath("/cxc")
  revalidatePath("/cxc/aging")
  return { success: true }
}

// ── Pagos / Abonos ────────────────────────────────────────────────────────────

export async function createCxcPayment(debtId: string, formData: FormData) {
  const supabase = await createClient()

  const amountRaw = formData.get("amount") as string
  const amount = parseFloat(amountRaw)
  const payment_date = formData.get("payment_date") as string
  const notes = (formData.get("notes") as string) || null

  if (isNaN(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0" }
  if (!payment_date) return { error: "La fecha es requerida" }

  console.log("[CxcPayments] Creating payment:", { debtId, amount })
  const { error } = await supabase.from("cxc_payments").insert({
    debt_id: debtId,
    amount,
    payment_date,
    notes,
  })

  if (error) {
    console.error("[CxcPayments] Error creating payment:", error)
    return { error: `Error al registrar el abono: ${error.message}` }
  }

  revalidatePath("/cxc")
  revalidatePath(`/cxc/${debtId}`)
  revalidatePath("/cxc/aging")
  return { success: true }
}

export async function deleteCxcPayment(id: string, debtId: string) {
  const supabase = await createClient()

  console.log("[CxcPayments] Deleting payment:", id)
  const { error } = await supabase.from("cxc_payments").delete().eq("id", id)

  if (error) {
    console.error("[CxcPayments] Error deleting payment:", error)
    return { error: "Error al eliminar el abono" }
  }

  revalidatePath("/cxc")
  revalidatePath(`/cxc/${debtId}`)
  revalidatePath("/cxc/aging")
  return { success: true }
}
