import { format, subMonths } from "date-fns"
import { KpiGerencialDashboard } from "@/components/kpi-gerencial/kpi-gerencial-dashboard"
import { getKpiGerencialData, emptyMonthSummary, type KpiGerencialData } from "@/lib/kpi-gerencial"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[kpi-gerencial/page]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

export default async function KpiGerencialPage() {
  log("Renderizando KpiGerencialPage")

  const today = new Date()
  const monthBStr = format(today, "yyyy-MM")
  const monthAStr = format(subMonths(today, 1), "yyyy-MM")

  let data: KpiGerencialData

  try {
    data = await getKpiGerencialData(monthAStr, monthBStr)
  } catch (err) {
    logError("Error no controlado en getKpiGerencialData", err)
    data = {
      monthA: emptyMonthSummary(monthAStr),
      monthB: emptyMonthSummary(monthBStr),
      trend: [],
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <KpiGerencialDashboard initialData={data} />
    </main>
  )
}
