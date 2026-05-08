import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface ExtractedInvoice {
  date: string
  supplier: string | null
  amount: number
  description: string | null
}

export async function analyzeInvoiceImage(
  base64Image: string,
  mimeType: string
): Promise<ExtractedInvoice | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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

    // Strip markdown code blocks if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    // Extract JSON object even if there's surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[Gemini] No JSON found in response:", cleaned)
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedInvoice

    // Coerce amount to number if Gemini returned it as string
    if (typeof parsed.amount === "string") {
      parsed.amount = parseFloat((parsed.amount as string).replace(/[^0-9.]/g, ""))
    }

    if (typeof parsed.amount !== "number" || isNaN(parsed.amount) || parsed.amount <= 0) {
      console.error("[Gemini] Invalid amount:", parsed.amount)
      return null
    }

    // Ensure date is valid, fallback to today
    if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      parsed.date = today
    }

    return parsed
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[Gemini] Error analyzing invoice:", msg)
    return null
  }
}
