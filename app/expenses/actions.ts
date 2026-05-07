"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ── Categories ────────────────────────────────────────────────────────────────

export async function getExpenseCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name")

  if (error) {
    console.error("[ExpenseCategories] Error fetching categories:", error)
    return []
  }
  return data
}

export async function createExpenseCategory(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || "#6366f1"

  if (!name?.trim()) return { error: "El nombre es requerido" }

  console.log("[ExpenseCategories] Creating category:", { name, color })
  const { error } = await supabase
    .from("expense_categories")
    .insert({ name: name.trim(), color })

  if (error) {
    console.error("[ExpenseCategories] Error creating category:", error)
    return { error: `Error al crear la categoría: ${error.message}` }
  }

  revalidatePath("/expenses/categories")
  revalidatePath("/expenses")
  return { success: true }
}

export async function updateExpenseCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const color = formData.get("color") as string

  if (!name?.trim()) return { error: "El nombre es requerido" }

  console.log("[ExpenseCategories] Updating category:", { id, name, color })
  const { error } = await supabase
    .from("expense_categories")
    .update({ name: name.trim(), color })
    .eq("id", id)

  if (error) {
    console.error("[ExpenseCategories] Error updating category:", error)
    return { error: "Error al actualizar la categoría" }
  }

  revalidatePath("/expenses/categories")
  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpenseCategory(id: string) {
  const supabase = await createClient()

  console.log("[ExpenseCategories] Deleting category:", id)
  const { error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[ExpenseCategories] Error deleting category:", error)
    return { error: "Error al eliminar la categoría" }
  }

  revalidatePath("/expenses/categories")
  revalidatePath("/expenses")
  return { success: true }
}

// ── Suppliers (Proveedores) ──────────────────────────────────────────────────

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name")

  if (error) {
    console.error("[Suppliers] Error fetching suppliers:", error)
    return []
  }
  return data
}

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const contact = (formData.get("contact") as string) || null
  const phone = (formData.get("phone") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!name?.trim()) return { error: "El nombre es requerido" }

  const { error } = await supabase.from("suppliers").insert({
    name: name.trim(),
    contact,
    phone,
    notes,
    is_active: true,
  })

  if (error) {
    console.error("[Suppliers] Error creating supplier:", error)
    return { error: `Error al crear el proveedor: ${error.message}` }
  }

  revalidatePath("/expenses/suppliers")
  return { success: true }
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const contact = (formData.get("contact") as string) || null
  const phone = (formData.get("phone") as string) || null
  const notes = (formData.get("notes") as string) || null
  const is_active = formData.get("is_active") === "on"

  if (!name?.trim()) return { error: "El nombre es requerido" }

  const { error } = await supabase
    .from("suppliers")
    .update({ name: name.trim(), contact, phone, notes, is_active })
    .eq("id", id)

  if (error) {
    console.error("[Suppliers] Error updating supplier:", error)
    return { error: "Error al actualizar el proveedor" }
  }

  revalidatePath("/expenses/suppliers")
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("suppliers").delete().eq("id", id)

  if (error) {
    console.error("[Suppliers] Error deleting supplier:", error)
    return { error: "Error al eliminar el proveedor" }
  }

  revalidatePath("/expenses/suppliers")
  return { success: true }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(filters?: { from?: string; to?: string; category_id?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from("expenses")
    .select("*, expense_categories(id, name, color)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.from) query = query.gte("date", filters.from)
  if (filters?.to) query = query.lte("date", filters.to)
  if (filters?.category_id) query = query.eq("category_id", filters.category_id)

  const { data, error } = await query

  if (error) {
    console.error("[Expenses] Error fetching expenses:", error)
    return []
  }
  return data
}

export async function createExpense(formData: FormData) {
  const supabase = await createClient()

  const date = formData.get("date") as string
  const category_id = (formData.get("category_id") as string) || null
  const supplier = (formData.get("supplier") as string) || null
  const description = (formData.get("description") as string) || null
  const amount = parseFloat(formData.get("amount") as string)
  const amount_without_tax_raw = formData.get("amount_without_tax") as string
  const amount_without_tax = amount_without_tax_raw ? parseFloat(amount_without_tax_raw) : null
  const tax_amount = amount_without_tax != null ? amount - amount_without_tax : null
  const notes = (formData.get("notes") as string) || null

  if (!date) return { error: "La fecha es requerida" }
  if (isNaN(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0" }

  console.log("[Expenses] Creating expense:", { date, category_id, supplier, amount })
  const { error } = await supabase.from("expenses").insert({
    date,
    category_id,
    supplier,
    description,
    amount,
    amount_without_tax,
    tax_amount,
    notes,
  })

  if (error) {
    console.error("[Expenses] Error creating expense:", error)
    return { error: "Error al registrar el gasto" }
  }

  revalidatePath("/expenses")
  return { success: true }
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient()

  const date = formData.get("date") as string
  const category_id = (formData.get("category_id") as string) || null
  const supplier = (formData.get("supplier") as string) || null
  const description = (formData.get("description") as string) || null
  const amount = parseFloat(formData.get("amount") as string)
  const notes = (formData.get("notes") as string) || null

  if (!date) return { error: "La fecha es requerida" }
  if (isNaN(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0" }

  const { error } = await supabase
    .from("expenses")
    .update({ date, category_id, supplier, description, amount, amount_without_tax: null, tax_amount: null, notes })
    .eq("id", id)

  if (error) {
    console.error("[Expenses] Error updating expense:", error)
    return { error: `Error al actualizar: ${error.message}` }
  }

  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()

  console.log("[Expenses] Deleting expense:", id)
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) {
    console.error("[Expenses] Error deleting expense:", error)
    return { error: "Error al eliminar el gasto" }
  }

  revalidatePath("/expenses")
  return { success: true }
}
