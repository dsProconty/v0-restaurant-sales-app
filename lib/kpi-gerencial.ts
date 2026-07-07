import { createClient } from "@/lib/supabase/server"
import { format, startOfMonth, endOfMonth, subMonths, parse } from "date-fns"
import { es } from "date-fns/locale"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[kpi-gerencial]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── Types ─────────────────────────────────────────────────────────────────
export interface CategoryStat {
  category: string
  revenue: number
  quantity: number
}

export interface ProductStat {
  name: string
  category: string
  quantity: number
  revenue: number
}

export interface MonthSummary {
  month: string   // "yyyy-MM"
  label: string   // "Junio 2026"
  total: number
  unitsTotal: number
  avgTicket: number
  categoryStats: CategoryStat[]
  productStats: ProductStat[]
}

export interface MonthlyTrendPoint {
  month: string   // "yyyy-MM"
  label: string   // "Jun"
  total: number
}

export interface KpiGerencialData {
  monthA: MonthSummary
  monthB: MonthSummary
  trend: MonthlyTrendPoint[]
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// ─── Helpers de fecha ────────────────────────────────────────────────────────
export function isValidMonth(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value)
}

function monthLabel(monthStr: string): string {
  const d = parse(monthStr, "yyyy-MM", new Date())
  const label = format(d, "MMMM yyyy", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function monthRange(monthStr: string) {
  const d = parse(monthStr, "yyyy-MM", new Date())
  return {
    start: format(startOfMonth(d), "yyyy-MM-dd"),
    end: format(endOfMonth(d), "yyyy-MM-dd"),
  }
}

// ─── Resumen de un mes ───────────────────────────────────────────────────────
async function getMonthSummary(supabase: SupabaseClient, monthStr: string): Promise<MonthSummary> {
  const { start, end } = monthRange(monthStr)

  const [salesRes, itemsRes] = await Promise.all([
    supabase.from("daily_sales").select("total_revenue").gte("sale_date", start).lte("sale_date", end),
    supabase
      .from("sales_items")
      .select(`
        quantity, subtotal,
        products ( name, category ),
        daily_sales!inner ( sale_date )
      `)
      .gte("daily_sales.sale_date", start)
      .lte("daily_sales.sale_date", end),
  ])

  if (salesRes.error) logError(`daily_sales (${monthStr})`, salesRes.error)
  if (itemsRes.error) logError(`sales_items (${monthStr})`, itemsRes.error)

  const total = salesRes.data?.reduce((s, r) => s + (r.total_revenue ?? 0), 0) ?? 0

  const catMap: Record<string, { revenue: number; quantity: number }> = {}
  const productMap: Record<string, ProductStat> = {}
  let unitsTotal = 0

  for (const item of itemsRes.data ?? []) {
    const p = item.products as { name?: string; category?: string | null } | null
    const cat = p?.category ?? "Sin categoría"
    const name = p?.name ?? "Desconocido"
    const qty = item.quantity ?? 0
    const rev = item.subtotal ?? 0

    unitsTotal += qty

    if (!catMap[cat]) catMap[cat] = { revenue: 0, quantity: 0 }
    catMap[cat].revenue += rev
    catMap[cat].quantity += qty

    const key = `${name}__${cat}`
    if (!productMap[key]) productMap[key] = { name, category: cat, quantity: 0, revenue: 0 }
    productMap[key].quantity += qty
    productMap[key].revenue += rev
  }

  const categoryStats = Object.entries(catMap)
    .map(([category, s]) => ({ category, ...s }))
    .sort((a, b) => b.revenue - a.revenue)

  const productStats = Object.values(productMap).sort((a, b) => b.revenue - a.revenue)

  log(`Resumen ${monthStr}`, { total, unitsTotal, categorias: categoryStats.length, productos: productStats.length })

  return {
    month: monthStr,
    label: monthLabel(monthStr),
    total,
    unitsTotal,
    avgTicket: unitsTotal > 0 ? total / unitsTotal : 0,
    categoryStats,
    productStats,
  }
}

// ─── Tendencia de últimos N meses ────────────────────────────────────────────
async function getTrend(supabase: SupabaseClient, throughMonthStr: string, count = 6): Promise<MonthlyTrendPoint[]> {
  const throughDate = parse(throughMonthStr, "yyyy-MM", new Date())
  const startDate = startOfMonth(subMonths(throughDate, count - 1))
  const endDate = endOfMonth(throughDate)

  const res = await supabase
    .from("daily_sales")
    .select("total_revenue, sale_date")
    .gte("sale_date", format(startDate, "yyyy-MM-dd"))
    .lte("sale_date", format(endDate, "yyyy-MM-dd"))

  if (res.error) logError("trend", res.error)

  const totalsByMonth: Record<string, number> = {}
  for (const row of res.data ?? []) {
    const monthKey = row.sale_date.slice(0, 7)
    totalsByMonth[monthKey] = (totalsByMonth[monthKey] ?? 0) + (row.total_revenue ?? 0)
  }

  const points: MonthlyTrendPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = subMonths(throughDate, i)
    const monthKey = format(d, "yyyy-MM")
    points.push({
      month: monthKey,
      label: format(d, "MMM", { locale: es }).replace(".", ""),
      total: totalsByMonth[monthKey] ?? 0,
    })
  }
  return points
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function getKpiGerencialData(monthAStr: string, monthBStr: string): Promise<KpiGerencialData> {
  log("Fetch iniciado", { monthAStr, monthBStr })
  const supabase = await createClient()

  const [monthA, monthB, trend] = await Promise.all([
    getMonthSummary(supabase, monthAStr),
    getMonthSummary(supabase, monthBStr),
    getTrend(supabase, monthBStr, 6),
  ])

  log("Fetch completo ✓", { totalA: monthA.total, totalB: monthB.total })
  return { monthA, monthB, trend }
}

export function emptyMonthSummary(monthStr: string): MonthSummary {
  return {
    month: monthStr,
    label: monthLabel(monthStr),
    total: 0,
    unitsTotal: 0,
    avgTicket: 0,
    categoryStats: [],
    productStats: [],
  }
}
