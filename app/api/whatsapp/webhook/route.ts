import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { analyzeInvoiceImage } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_FROM!

async function sendReply(to: string, message: string) {
  const client = twilio(ACCOUNT_SID, AUTH_TOKEN)
  await client.messages.create({ from: FROM_NUMBER, to, body: message })
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

function findBestMatch<T extends { id: string; name: string }>(
  needle: string | null | undefined,
  haystack: T[]
): T | null {
  if (!needle) return null
  const n = normalize(needle)
  if (!n) return null
  const exact = haystack.find((h) => normalize(h.name) === n)
  if (exact) return exact
  const partial = haystack.find(
    (h) => normalize(h.name).includes(n) || n.includes(normalize(h.name))
  )
  return partial ?? null
}

export async function POST(req: NextRequest) {
  const text = await req.text()
  const params = new URLSearchParams(text)
  const body: Record<string, string> = {}
  params.forEach((value, key) => { body[key] = value })

  const from: string = body.From ?? ""
  const numMedia = parseInt(body.NumMedia ?? "0")

  if (numMedia === 0) {
    await sendReply(
      from,
      "Hola! 👋 Para registrar un gasto, envíame una foto de la factura o ticket y lo registro automáticamente en el sistema."
    )
    return new NextResponse("OK", { status: 200 })
  }

  const mediaUrl: string = body.MediaUrl0 ?? ""
  const mediaContentType: string = body.MediaContentType0 ?? ""

  if (!mediaContentType.startsWith("image/")) {
    await sendReply(from, "Solo puedo procesar imágenes. Por favor envía una foto de la factura.")
    return new NextResponse("OK", { status: 200 })
  }

  try {
    const imageResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
      },
    })

    if (!imageResponse.ok) {
      await sendReply(from, "No pude descargar la imagen. Intenta enviarla de nuevo.")
      return new NextResponse("OK", { status: 200 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")

    await sendReply(from, "📷 Imagen recibida, analizando factura...")

    const supabase = await createClient()

    // Fetch existing categories and suppliers to feed into Gemini
    const [{ data: categoriesData }, { data: suppliersData }] = await Promise.all([
      supabase.from("expense_categories").select("id, name"),
      supabase.from("suppliers").select("id, name").eq("is_active", true),
    ])
    const categories = categoriesData ?? []
    const suppliers = suppliersData ?? []

    const result = await analyzeInvoiceImage(imageBase64, mediaContentType, {
      categories: categories.map((c) => c.name),
      suppliers: suppliers.map((s) => s.name),
    })

    if (!result.ok) {
      await sendReply(
        from,
        `❌ No pude procesar la factura.\n\nDetalle: ${result.error}\n\nReintenta con una foto más clara.`
      )
      return new NextResponse("OK", { status: 200 })
    }

    const extracted = result.data

    // Match supplier and category to existing IDs (fuzzy match by name)
    const matchedSupplier = findBestMatch(extracted.supplier, suppliers)
    const matchedCategory = findBestMatch(extracted.category, categories)

    // If supplier doesn't exist, create it automatically
    let finalSupplierName = extracted.supplier ?? null
    if (extracted.supplier && !matchedSupplier) {
      const { data: created, error: createErr } = await supabase
        .from("suppliers")
        .insert({ name: extracted.supplier.trim() })
        .select("id, name")
        .single()
      if (!createErr && created) {
        finalSupplierName = created.name
        console.log("[WhatsApp] Auto-created supplier:", created.name)
      }
    } else if (matchedSupplier) {
      finalSupplierName = matchedSupplier.name
    }

    const { error } = await supabase.from("expenses").insert({
      date: extracted.date,
      category_id: matchedCategory?.id ?? null,
      supplier: finalSupplierName,
      description: extracted.description ?? null,
      amount: extracted.amount,
      notes: `Registrado vía WhatsApp (${from})`,
      source: "whatsapp",
    })

    if (error) {
      console.error("[WhatsApp] Supabase insert error:", error)
      await sendReply(from, "La factura fue leída pero hubo un error al guardarla. Por favor intenta de nuevo.")
      return new NextResponse("OK", { status: 200 })
    }

    revalidatePath("/expenses")

    const dateFormatted = new Date(extracted.date + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const supplierLine = matchedSupplier
      ? `🏪 Proveedor: ${matchedSupplier.name} (existente)`
      : finalSupplierName
        ? `🏪 Proveedor: ${finalSupplierName} (nuevo, agregado al catálogo)`
        : "🏪 Proveedor: No identificado"

    const categoryLine = matchedCategory
      ? `🏷️ Categoría: ${matchedCategory.name}`
      : extracted.category
        ? `🏷️ Categoría: ${extracted.category} (sin asignar — no coincide con ninguna existente)`
        : "🏷️ Categoría: No identificada"

    await sendReply(
      from,
      `✅ *Gasto registrado exitosamente*\n\n` +
        `📅 Fecha: ${dateFormatted}\n` +
        `${supplierLine}\n` +
        `${categoryLine}\n` +
        `💰 Monto: $${Number(extracted.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}\n` +
        (extracted.description ? `📝 ${extracted.description}\n` : "") +
        `\nPuedes verlo en la sección de Gastos del sistema.`
    )

    return new NextResponse("OK", { status: 200 })
  } catch (err) {
    console.error("[WhatsApp] Unexpected error:", err)
    await sendReply(from, "Ocurrió un error inesperado. Por favor intenta de nuevo en unos momentos.")
    return new NextResponse("OK", { status: 200 })
  }
}
