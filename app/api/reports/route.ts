import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  format,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  subMonths, subDays,
  eachDayOfInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import type { DailyPoint, CategoryStat, ProductStat } from "@/app/reports/page"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[api/reports]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── Tipos de rango ──────────────────────────────────────────────────────────
export type DateRange = "hoy" | "semana" | "mes"

export interface RangeData {
  total: number
  prevTotal: number
  change: number
  avgDaily: number
  daysRecorded: number
  categoryStats: CategoryStat[]
  topProducts: ProductStat[]
  trendPoints: DailyPoint[]
  label: string
  prevLabel: string
}

// ─── Helper: suma total_revenue ──────────────────────────────────────────────
const sum = (arr: { total_revenue: number }[] | null) =>
  arr?.reduce((s, r) => s + (r.total_revenue ?? 0), 0) ?? 0

// ─── Calcula rangos según el tipo ────────────────────────────────────────────
function getRangeDates(range: DateRange, today: Date) {
  switch (range) {
    case "hoy": {
      const todayStr = format(today, "yyyy-MM-dd")
      const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd")
      return {
        start: todayStr, end: todayStr,
        prevStart: yesterdayStr, prevEnd: yesterdayStr,
        label: "hoy", prevLabel: "ayer",
      }
    }
    case "semana": {
      const wStart = startOfWeek(today, { weekStartsOn: 1 })
      const wEnd = endOfWeek(today, { weekStartsOn: 1 })
      const pwStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
      const pwEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 })
      return {
        start: format(wStart, "yyyy-MM-dd"), end: format(wEnd, "yyyy-MM-dd"),
        prevStart: format(pwStart, "yyyy-MM-dd"), prevEnd: format(pwEnd, "yyyy-MM-dd"),
        label: "esta semana", prevLabel: "semana anterior",
      }
    }
    case "mes":
    default: {
      const mStart = startOfMonth(today)
      const mEnd = endOfMonth(today)
      const pmStart = startOfMonth(subMonths(today, 1))
      const pmEnd = endOfMonth(subMonths(today, 1))
      return {
        start: format(mStart, "yyyy-MM-dd"), end: format(mEnd, "yyyy-MM-dd"),
        prevStart: format(pmStart, "yyyy-MM-dd"), prevEnd: format(pmEnd, "yyyy-MM-dd"),
        label: "este mes", prevLabel: "mes anterior",
      }
    }
  }
}

// ─── GET /api/reports?range=hoy|semana|mes&category=todas|X ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get("range") ?? "mes") as DateRange
  const category = searchParams.get("category") ?? "todas"

  log("Request", { range, category })

  try {
    const supabase = await createClient()
    const today = new Date()
    const dates = getRangeDates(range, today)

    log("Fechas calculadas", dates)

    // ── Queries en paralelo ────────────────────────────────────────────────
    const [currentRes, prevRes, itemsRes] = await Promise.all([
      // Ventas del rango actual
      supabase
        .from("daily_sales")
        .select("total_revenue, sale_date")
        .gte("sale_date", dates.start)
        .lte("sale_date", dates.end),
      // Ventas del rango anterior (para comparar)
      supabase
        .from("daily_sales")
        .select("total_revenue")
        .gte("sale_date", dates.prevStart)
        .lte("sale_date", dates.prevEnd),
      // Items de ventas con categoría (para breakdown)
      supabase
        .from("sales_items")
        .select(`
          quantity, subtotal,
          products ( name, category ),
          daily_sales!inner ( sale_date )
        `)
        .gte("daily_sales.sale_date", dates.start)
        .lte("daily_sales.sale_date", dates.end),
    ])

    if (currentRes.error) logError("currentRes", currentRes.error)
    if (prevRes.error) logError("prevRes", prevRes.error)
    if (itemsRes.error) logError("itemsRes", itemsRes.error)

    log("Queries OK", {
      current: currentRes.data?.length ?? 0,
      prev: prevRes.data?.length ?? 0,
      items: itemsRes.data?.length ?? 0,
    })

    // ── Totales ────────────────────────────────────────────────────────────
    const total = sum(currentRes.data)
    const prevTotal = sum(prevRes.data)
    const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
    const daysRecorded = currentRes.data?.length ?? 0
    const avgDaily = daysRecorded > 0 ? total / daysRecorded : 0

    // ── Tendencia (puntos del gráfico de líneas) ───────────────────────────
    // Para "hoy" mostramos las últimas 7 días; para semana/mes el rango actual
    let trendStart: Date
    let trendEnd: Date
    if (range === "hoy") {
      trendEnd = today
      trendStart = subDays(today, 6)
    } else {
      trendStart = new Date(dates.start + "T12:00:00")
      trendEnd = new Date(dates.end + "T12:00:00")
      if (trendEnd > today) trendEnd = today
    }

    const salesByDay: Record<string, number> = {}
    for (const row of currentRes.data ?? []) {
      salesByDay[row.sale_date] = (salesByDay[row.sale_date] ?? 0) + row.total_revenue
    }
    // Para "hoy" necesitamos los últimos 7 días completos
    if (range === "hoy") {
      const last7Res = await supabase
        .from("daily_sales")
        .select("total_revenue, sale_date")
        .gte("sale_date", format(trendStart, "yyyy-MM-dd"))
        .lte("sale_date", format(today, "yyyy-MM-dd"))
      for (const row of last7Res.data ?? []) {
        salesByDay[row.sale_date] = (salesByDay[row.sale_date] ?? 0) + row.total_revenue
      }
    }

    const trendPoints: DailyPoint[] = eachDayOfInterval({ start: trendStart, end: trendEnd })
      .map(d => ({
        date: format(d, "yyyy-MM-dd"),
        label: format(d, "EEE d", { locale: es }),
        amount: salesByDay[format(d, "yyyy-MM-dd")] ?? 0,
      }))

    // ── Categorías y productos ─────────────────────────────────────────────
    const catMap: Record<string, { revenue: number; quantity: number }> = {}
    const productMap: Record<string, ProductStat> = {}

    for (const item of itemsRes.data ?? []) {
      const p = item.products as { name?: string; category?: string | null } | null
      const cat = p?.category ?? "Sin categoría"
      const name = p?.name ?? "Desconocido"
      const qty = item.quantity ?? 0
      const rev = item.subtotal ?? 0

      // Filtrar por categoría si aplica
      if (category !== "todas" && cat !== category) continue

      if (!catMap[cat]) catMap[cat] = { revenue: 0, quantity: 0 }
      catMap[cat].revenue += rev
      catMap[cat].quantity += qty

      if (!productMap[name]) productMap[name] = { name, category: cat, quantity: 0, revenue: 0 }
      productMap[name].quantity += qty
      productMap[name].revenue += rev
    }

    // Stats de categoría siempre sin filtro (para mostrar los chips con totales)
    const allCatMap: Record<string, { revenue: number; quantity: number }> = {}
    for (const item of itemsRes.data ?? []) {
      const p = item.products as { name?: string; category?: string | null } | null
      const cat = p?.category ?? "Sin categoría"
      const qty = item.quantity ?? 0
      const rev = item.subtotal ?? 0
      if (!allCatMap[cat]) allCatMap[cat] = { revenue: 0, quantity: 0 }
      allCatMap[cat].revenue += rev
      allCatMap[cat].quantity += qty
    }

    const categoryStats: CategoryStat[] = Object.entries(allCatMap)
      .map(([cat, s]) => ({ category: cat, ...s }))
      .sort((a, b) => b.revenue - a.revenue)

    const topProducts: ProductStat[] = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    log("Resultado", { total, prevTotal, change: change.toFixed(1), cats: categoryStats.length })

    const result: RangeData = {
      total, prevTotal, change,
      avgDaily, daysRecorded,
      categoryStats, topProducts, trendPoints,
      label: dates.label, prevLabel: dates.prevLabel,
    }

    return NextResponse.json(result)
  } catch (err) {
    logError("Unhandled error", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
