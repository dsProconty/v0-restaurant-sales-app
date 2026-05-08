import { GoogleGenerativeAI } from "@google/generative-ai"

export interface ExtractedInvoice {
  date: string
  supplier: string | null
  amount: number
  description: string | null
}

export type AnalyzeResult =
  | { ok: true; data: ExtractedInvoice }
  | { ok: false; error: string }

export async function analyzeInvoiceImage(
  base64Image: string,
  mimeType: string
): Promise<AnalyzeResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, error: "GEMINI_API_KEY no está configurada en el servidor" }
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const today = new Date().toISOString().slice(0, 10)
    const prompt = `Eres un asistente que extrae datos de facturas y tickets de compra.

Analiza la imagen y extrae estos campos en JSON:
- date: fecha en formato YYYY-MM-DD. Si el formato es DD/MM/YYYY o DD-MM-YYYY conviértelo. Si no se ve claramente usa: ${today}
- supplier: nombre del negocio o proveedor que emite la factura (string, o null)
- amount: el monto TOTAL final a pagar, incluyendo impuestos. Solo el número, sin símbolos. Ej: 25.38
- description: lista breve de productos comprados (string, o null)

IMPORTANTE:
- Responde SOLO con el JSON, sin texto adicional ni markdown
- El campo amount debe ser un número (float), nunca string
- Si hay varios totales, usa el TOTAL final más grande
- Si la imagen es difícil de leer, intenta igual con lo que puedas ver

Formato exacto de respuesta:
{"date":"${today}","supplier":"Nombre del lugar","amount":99.99,"description":"Descripción"}`

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ])

    const text = result.response.text().trim()
    console.log("[Gemini] Raw response:", text)

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { ok: false, error: `Gemini no devolvió JSON. Respuesta: ${text.slice(0, 150)}` }
    }

    let parsed: ExtractedInvoice
    try {
      parsed = JSON.parse(jsonMatch[0]) as ExtractedInvoice
    } catch (e) {
      return { ok: false, error: `JSON inválido de Gemini: ${jsonMatch[0].slice(0, 150)}` }
    }

    if (typeof parsed.amount === "string") {
      parsed.amount = parseFloat((parsed.amount as string).replace(/[^0-9.]/g, ""))
    }

    if (typeof parsed.amount !== "number" || isNaN(parsed.amount) || parsed.amount <= 0) {
      return { ok: false, error: `Monto inválido extraído: ${parsed.amount}` }
    }

    if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      parsed.date = today
    }

    return { ok: true, data: parsed }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[Gemini] Error analyzing invoice:", msg)
    return { ok: false, error: `Error llamando a Gemini: ${msg.slice(0, 200)}` }
  }
}
