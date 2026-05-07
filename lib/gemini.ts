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
    const prompt = `Analiza esta imagen de una factura o ticket de compra y extrae la información en formato JSON.

Extrae los siguientes campos:
- date: fecha de la factura en formato YYYY-MM-DD (si no está clara usa: ${today})
- supplier: nombre del proveedor o establecimiento (string o null si no se identifica)
- amount: monto TOTAL de la factura incluyendo impuestos (número decimal, sin símbolo de moneda)
- description: descripción breve de qué se compró (string o null si no es claro)

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin explicaciones.
Ejemplo: {"date":"2024-01-15","supplier":"Comercial Mexicana","amount":1250.50,"description":"Compra de verduras y abarrotes"}`

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ])

    const text = result.response.text().trim()
    const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim()
    const parsed = JSON.parse(cleaned) as ExtractedInvoice

    if (typeof parsed.amount !== "number" || isNaN(parsed.amount) || parsed.amount <= 0) {
      console.error("[Gemini] Invalid amount:", parsed.amount)
      return null
    }

    return parsed
  } catch (err) {
    console.error("[Gemini] Error analyzing invoice:", err)
    return null
  }
}
