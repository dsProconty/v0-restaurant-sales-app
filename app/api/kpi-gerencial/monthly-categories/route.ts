import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAvailableMonths, getMonthlyCategoryBreakdown } from "@/lib/kpi-gerencial"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[api/kpi-gerencial/monthly-categories]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── GET /api/kpi-gerencial/monthly-categories ──────────────────────────────
// Desglose de categorías (ingresos/unidades) para TODOS los meses con ventas
// registradas — usado por el preset "Todo el historial".
export async function GET() {
  try {
    const supabase = await createClient()
    const months = await getAvailableMonths(supabase)
    log("Meses disponibles", { count: months.length })

    const breakdown = await getMonthlyCategoryBreakdown(months)
    return NextResponse.json({ months: breakdown })
  } catch (err) {
    logError("Unhandled error", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
