import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subDays,
  eachDayOfInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"

// ─── Logger ────────────────────────────────────────────────────────────────
const LOG = "[reports/page]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── Types ─────────────────────────────────────────────────────────────────
export interface DailyPoint {
  date: string   // "YYYY-MM-DD"
  label: string  // "lun 10"
  amount: number
}

export interface CategoryStat {
  category: string
  revenue: number
  quantity: number
}

export interface ProductStat {
  name: string
  category: string | null
  quantity: number
  revenue: number
}

export interface ReportData {
  todayTotal: number
  prevDayTotal: number
  currentWeekTotal: number
  prevWeekTotal: number
  currentMonthTotal: number
  prevMonthTotal: number
  avgDailySales: number
  daysRecorded: number
  dayOverDayChange: number
  weekOverWeekChange: number
  monthOverMonthChange: number
  last7Days: DailyPoint[]
  categoryStats: CategoryStat[]
  topProducts: ProductStat[]
  projectedMonthTotal: number
  monthProgressPct: number
  daysInMonth: number
  dayOfMonth: number
  bestDay: { date: string; amount: number } | null
  worstDay: { date: string; amount: number } | null
}

// ─── Data fetching ──────────────────────────────────────────────────────────
async function getReportData(): Promise<ReportData> {
  log("Iniciando fetch de datos...")
  const supabase = await createClient()
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd")

  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  const prevMonthStart = startOfMonth(subMonths(today, 1))
  const prevMonthEnd = endOfMonth(subMonths(today, 1))
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const prevWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 })
  const sevenDaysAgo = subDays(today, 6)

  log("Rangos de fecha calculados", {
    today: todayStr,
    monthStart: format(currentMonthStart, "yyyy-MM-dd"),
    sevenDaysAgo: format(sevenDaysAgo, "yyyy-MM-dd"),
  })

  // ── Queries en paralelo ─────────────────────────────────────────────────
  const [
    todayRes, yesterdayRes,
    currentMonthRes, prevMonthRes,
    currentWeekRes, prevWeekRes,
    last7DaysRes, topProductsRes,
  ] = await Promise.all([
    supabase.from("daily_sales").select("total_revenue").eq("sale_date", todayStr),
    supabase.from("daily_sales").select("total_revenue").eq("sale_date", yesterdayStr),
    supabase.from("daily_sales").select("total_revenue, sale_date")
      .gte("sale_date", format(currentMonthStart, "yyyy-MM-dd"))
      .lte("sale_date", format(currentMonthEnd, "yyyy-MM-dd")),
    supabase.from("daily_sales").select("total_revenue")
      .gte("sale_date", format(prevMonthStart, "yyyy-MM-dd"))
      .lte("sale_date", format(prevMonthEnd, "yyyy-MM-dd")),
    supabase.from("daily_sales").select("total_revenue")
      .gte("sale_date", format(currentWeekStart, "yyyy-MM-dd"))
      .lte("sale_date", format(currentWeekEnd, "yyyy-MM-dd")),
    supabase.from("daily_sales").select("total_revenue")
      .gte("sale_date", format(prevWeekStart, "yyyy-MM-dd"))
      .lte("sale_date", format(prevWeekEnd, "yyyy-MM-dd")),
    supabase.from("daily_sales").select("total_revenue, sale_date")
      .gte("sale_date", format(sevenDaysAgo, "yyyy-MM-dd"))
      .lte("sale_date", todayStr),
    supabase.from("sales_items").select(`
      quantity, subtotal,
      products ( name, category ),
      daily_sales!inner ( sale_date )
    `)
      .gte("daily_sales.sale_date", format(currentMonthStart, "yyyy-MM-dd"))
      .lte("daily_sales.sale_date", format(currentMonthEnd, "yyyy-MM-dd")),
  ])

  // Log errores de Supabase
  const queryLog = [
    { name: "today", res: todayRes },
    { name: "yesterday", res: yesterdayRes },
    { name: "currentMonth", res: currentMonthRes },
    { name: "prevMonth", res: prevMonthRes },
    { name: "currentWeek", res: currentWeekRes },
    { name: "prevWeek", res: prevWeekRes },
    { name: "last7Days", res: last7DaysRes },
    { name: "topProducts", res: topProductsRes },
  ]
  for (const q of queryLog) {
    if (q.res.error) {
      logError(`Query "${q.name}" falló`, q.res.error)
    } else {
      log(`Query "${q.name}" OK`, { rows: q.res.data?.length ?? 0 })
    }
  }

  // ── Totales ─────────────────────────────────────────────────────────────
  const sum = (arr: { total_revenue: number }[] | null) =>
    arr?.reduce((s, r) => s + (r.total_revenue ?? 0), 0) ?? 0

  const todayTotal = sum(todayRes.data)
  const prevDayTotal = sum(yesterdayRes.data)
  const currentMonthTotal = sum(currentMonthRes.data)
  const prevMonthTotal = sum(prevMonthRes.data)
  const currentWeekTotal = sum(currentWeekRes.data)
  const prevWeekTotal = sum(prevWeekRes.data)

  const pct = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0

  const daysRecorded = currentMonthRes.data?.length ?? 0
  const avgDailySales = daysRecorded > 0 ? currentMonthTotal / daysRecorded : 0

  log("Totales calculados", { todayTotal, currentMonthTotal, prevMonthTotal })

  // ── Últimos 7 días (chart) ───────────────────────────────────────────────
  const salesMap: Record<string, number> = {}
  for (const row of last7DaysRes.data ?? []) {
    salesMap[row.sale_date] = (salesMap[row.sale_date] ?? 0) + row.total_revenue
  }
  const last7Days: DailyPoint[] = eachDayOfInterval({ start: sevenDaysAgo, end: today }).map(d => ({
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "EEE d", { locale: es }),
    amount: salesMap[format(d, "yyyy-MM-dd")] ?? 0,
  }))

  // ── Categorías y productos ───────────────────────────────────────────────
  const catMap: Record<string, { revenue: number; quantity: number }> = {}
  const productMap: Record<string, ProductStat> = {}

  for (const item of topProductsRes.data ?? []) {
    const p = item.products as { name?: string; category?: string | null } | null
    const cat = p?.category ?? "Sin categoría"
    const name = p?.name ?? "Desconocido"
    const qty = item.quantity ?? 0
    const rev = item.subtotal ?? 0

    if (!catMap[cat]) catMap[cat] = { revenue: 0, quantity: 0 }
    catMap[cat].revenue += rev
    catMap[cat].quantity += qty

    if (!productMap[name]) productMap[name] = { name, category: cat, quantity: 0, revenue: 0 }
    productMap[name].quantity += qty
    productMap[name].revenue += rev
  }

  const categoryStats: CategoryStat[] = Object.entries(catMap)
    .map(([category, s]) => ({ category, ...s }))
    .sort((a, b) => b.revenue - a.revenue)

  const topProducts: ProductStat[] = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  log("Categorías", categoryStats)

  // ── Mejor / peor día ─────────────────────────────────────────────────────
  const daily = (currentMonthRes.data ?? [])
    .map(s => ({ date: s.sale_date, amount: s.total_revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const bestDay = daily.length > 0 ? daily.reduce((b, d) => d.amount > b.amount ? d : b) : null
  const worstDay = daily.length > 0 ? daily.reduce((w, d) => d.amount < w.amount ? d : w) : null

  // ── Proyección ───────────────────────────────────────────────────────────
  const dayOfMonth = today.getDate()
  const daysInMonth = endOfMonth(today).getDate()
  const projectedMonthTotal = daysRecorded > 0
    ? (currentMonthTotal / dayOfMonth) * daysInMonth
    : 0
  const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100)

  log("Proyección", { projectedMonthTotal: projectedMonthTotal.toFixed(2), monthProgressPct })
  log("Fetch completo ✓")

  return {
    todayTotal, prevDayTotal,
    currentWeekTotal, prevWeekTotal,
    currentMonthTotal, prevMonthTotal,
    avgDailySales, daysRecorded,
    dayOverDayChange: pct(todayTotal, prevDayTotal),
    weekOverWeekChange: pct(currentWeekTotal, prevWeekTotal),
    monthOverMonthChange: pct(currentMonthTotal, prevMonthTotal),
    last7Days, categoryStats, topProducts,
    projectedMonthTotal, monthProgressPct, daysInMonth, dayOfMonth,
    bestDay, worstDay,
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ReportsPage() {
  log("Renderizando ReportsPage")
  let data: ReportData

  try {
    data = await getReportData()
  } catch (err) {
    logError("Error no controlado en getReportData", err)
    const today = new Date()
    data = {
      todayTotal: 0, prevDayTotal: 0,
      currentWeekTotal: 0, prevWeekTotal: 0,
      currentMonthTotal: 0, prevMonthTotal: 0,
      avgDailySales: 0, daysRecorded: 0,
      dayOverDayChange: 0, weekOverWeekChange: 0, monthOverMonthChange: 0,
      last7Days: [], categoryStats: [], topProducts: [],
      projectedMonthTotal: 0, monthProgressPct: 0,
      daysInMonth: endOfMonth(today).getDate(), dayOfMonth: today.getDate(),
      bestDay: null, worstDay: null,
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <ReportsDashboard data={data} />
      </main>
    </div>
  )
}
