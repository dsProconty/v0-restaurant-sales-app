import { NextRequest, NextResponse } from "next/server"
import { getKpiGerencialData, isValidMonth } from "@/lib/kpi-gerencial"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[api/kpi-gerencial]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── GET /api/kpi-gerencial?monthA=yyyy-MM&monthB=yyyy-MM&trendStart=yyyy-MM ─
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const monthA = searchParams.get("monthA")
  const monthB = searchParams.get("monthB")
  const trendStartParam = searchParams.get("trendStart")

  if (!isValidMonth(monthA) || !isValidMonth(monthB)) {
    logError("Parámetros inválidos", { monthA, monthB })
    return NextResponse.json(
      { error: "Parámetros monthA/monthB inválidos (formato esperado yyyy-MM)" },
      { status: 400 },
    )
  }

  if (trendStartParam !== null && !isValidMonth(trendStartParam)) {
    logError("trendStart inválido", { trendStartParam })
    return NextResponse.json({ error: "Parámetro trendStart inválido (formato esperado yyyy-MM)" }, { status: 400 })
  }

  log("Request", { monthA, monthB, trendStartParam })

  try {
    const data = await getKpiGerencialData(monthA, monthB, trendStartParam ?? undefined)
    return NextResponse.json(data)
  } catch (err) {
    logError("Unhandled error", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
