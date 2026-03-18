"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import type { ReportData, CategoryStat, ProductStat, DailyPoint } from "@/app/reports/page"
import type { RangeData } from "@/app/api/reports/route"
import { KpiCard } from "@/components/reports/kpi-card"
import { WeeklyTrendChart } from "@/components/reports/weekly-trend-chart"
import { CategoryChart } from "@/components/reports/category-chart"
import { ProjectionInsight } from "@/components/reports/projection-insight"
import { TopProductsList } from "@/components/reports/top-products-list"
import { DollarSign, Calendar, TrendingUp, BarChart3, Loader2 } from "lucide-react"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[ReportsDashboard]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── Types ───────────────────────────────────────────────────────────────────
type DateRange = "hoy" | "semana" | "mes"

interface Props {
  data: ReportData
}

function fmt(n: number) {
  return n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Paleta de colores por posición de categoría (consistente)
const CAT_COLORS = [
  "#E85D04", "#3266AD", "#854F0B", "#0F6E56",
  "#7F77DD", "#D85A30", "#639922", "#888780",
  "#993556", "#1D9E75",
]

// ─── Component ───────────────────────────────────────────────────────────────
export function ReportsDashboard({ data }: Props) {
  const [activeRange, setActiveRange] = useState<DateRange>("mes")
  const [activeCat, setActiveCat] = useState<string>("todas")
  const [rangeData, setRangeData] = useState<RangeData | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Fetch dinámico al cambiar rango o categoría ──────────────────────────
  const fetchRangeData = useCallback(async (range: DateRange, category: string) => {
    log("Fetch iniciado", { range, category })
    setLoading(true)
    try {
      const params = new URLSearchParams({ range, category })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: RangeData = await res.json()
      log("Fetch OK", { total: json.total, cats: json.categoryStats.length })
      setRangeData(json)
    } catch (err) {
      logError("Fetch falló", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch inicial al montar
  useEffect(() => {
    fetchRangeData(activeRange, activeCat)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manejadores ─────────────────────────────────────────────────────────
  function handleRangeChange(range: DateRange) {
    log("Rango →", range)
    setActiveRange(range)
    fetchRangeData(range, activeCat)
  }

  function handleCatChange(cat: string) {
    log("Categoría →", cat)
    setActiveCat(cat)
    fetchRangeData(activeRange, cat)
  }

  // ── Datos a mostrar: usa rangeData si está disponible, si no el inicial ──
  const displayCategoryStats: CategoryStat[] = rangeData?.categoryStats ?? data.categoryStats
  const displayProducts: ProductStat[] = rangeData?.topProducts ?? data.topProducts
  const displayTrend: DailyPoint[] = rangeData?.trendPoints ?? data.last7Days
  const displayTotal = rangeData?.total ?? data.currentMonthTotal
  const displayPrevTotal = rangeData?.prevTotal ?? data.prevMonthTotal
  const displayChange = rangeData?.change ?? data.monthOverMonthChange
  const displayAvg = rangeData?.avgDaily ?? data.avgDailySales
  const displayDays = rangeData?.daysRecorded ?? data.daysRecorded
  const displayPrevLabel = rangeData?.prevLabel ?? "mes anterior"

  // Categorías activas con su color asignado
  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {}
    displayCategoryStats.forEach((c, i) => {
      colors[c.category] = CAT_COLORS[i % CAT_COLORS.length]
    })
    return colors
  }, [displayCategoryStats])

  // Stats de la categoría activa para el detalle inline
  const activeCatStats = useMemo(() => {
    if (activeCat === "todas") return null
    return displayCategoryStats.find(c => c.category === activeCat) ?? null
  }, [displayCategoryStats, activeCat])

  const totalRevenue = useMemo(() =>
    displayCategoryStats.reduce((s, c) => s + c.revenue, 0),
    [displayCategoryStats]
  )
  const totalQty = useMemo(() =>
    displayCategoryStats.reduce((s, c) => s + c.quantity, 0),
    [displayCategoryStats]
  )

  const catRevPct = activeCatStats && totalRevenue > 0
    ? (activeCatStats.revenue / totalRevenue) * 100 : 0
  const catQtyPct = activeCatStats && totalQty > 0
    ? (activeCatStats.quantity / totalQty) * 100 : 0
  const activeCatColor = activeCat !== "todas" ? (categoryColors[activeCat] ?? "#E85D04") : "#E85D04"

  // Label del KPI primario según rango
  const rangeLabel: Record<DateRange, string> = { hoy: "Hoy", semana: "Esta semana", mes: "Este mes" }
  const rangeHint: Record<DateRange, string> = { hoy: "vs ayer", semana: "vs semana anterior", mes: "vs mes anterior" }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis de ventas e información de rendimiento
        </p>
      </div>

      {/* ── FILTROS ── */}
      <div className="flex flex-col gap-4">

        {/* Selector de tiempo — pastilla unificada */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            {(["hoy", "semana", "mes"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                disabled={loading}
                className={[
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50",
                  activeRange === r
                    ? "bg-card text-[#E85D04] border border-[#E85D04]/40 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {{ hoy: "Hoy", semana: "Esta semana", mes: "Este mes" }[r]}
              </button>
            ))}
          </div>

          {/* Indicador de carga */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Actualizando...
            </div>
          )}
        </div>

        {/* Chips de categoría */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Chip "Todas" */}
          <button
            onClick={() => handleCatChange("todas")}
            disabled={loading}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 disabled:opacity-50",
              activeCat === "todas"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-border hover:text-foreground",
            ].join(" ")}
          >
            Todas
            {totalRevenue > 0 && (
              <span className={[
                "text-xs",
                activeCat === "todas" ? "opacity-70" : "text-muted-foreground",
              ].join(" ")}>
                ${fmt(totalRevenue)}
              </span>
            )}
          </button>

          {/* Chips de cada categoría */}
          {displayCategoryStats.map((cat) => {
            const color = categoryColors[cat.category] ?? "#888"
            const isActive = activeCat === cat.category
            return (
              <button
                key={cat.category}
                onClick={() => handleCatChange(cat.category)}
                disabled={loading}
                style={isActive ? { background: color, borderColor: color } : {}}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 disabled:opacity-50",
                  isActive
                    ? "text-white"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border",
                ].join(" ")}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isActive ? "rgba(255,255,255,0.7)" : color }}
                />
                {/* Normalizar capitalización */}
                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1).toLowerCase()}
                <span className={[
                  "text-xs",
                  isActive ? "opacity-75" : "text-muted-foreground",
                ].join(" ")}>
                  ${cat.revenue < 1000 ? fmt(cat.revenue) : `${(cat.revenue / 1000).toFixed(1)}k`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── KPIs principales — se actualizan con el rango ── */}
      <div className={[
        "grid grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity duration-200",
        loading ? "opacity-60" : "opacity-100",
      ].join(" ")}>
        <KpiCard
          label={rangeLabel[activeRange]}
          value={`$${fmt(displayTotal)}`}
          change={displayChange}
          hint={`vs ${displayPrevLabel}`}
          icon={<DollarSign className="h-4 w-4" />}
          highlight={activeRange === "mes"}
        />
        <KpiCard
          label="Período anterior"
          value={`$${fmt(displayPrevTotal)}`}
          hint={displayPrevLabel}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label="Promedio diario"
          value={`$${fmt(displayAvg)}`}
          hint={`${displayDays} día${displayDays !== 1 ? "s" : ""} con ventas`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Categorías activas"
          value={displayCategoryStats.length.toString()}
          hint={`${displayProducts.length} productos vendidos`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* ── Detalle de categoría (aparece al seleccionar una) ── */}
      {activeCatStats && (
        <div
          className="rounded-xl border border-border bg-muted/30 p-4"
          style={{ borderLeftWidth: 3, borderLeftColor: activeCatColor }}
        >
          {/* Header del detalle */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: activeCatColor }}
            />
            <span className="text-sm font-medium text-foreground">
              {activeCat.charAt(0).toUpperCase() + activeCat.slice(1).toLowerCase()}
            </span>
            <span className="text-xs text-muted-foreground">— detalle del período</span>
          </div>

          {/* Métricas de la categoría */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="rounded-lg bg-card border border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
              <p className="text-lg font-semibold text-foreground">${fmt(activeCatStats.revenue)}</p>
              <p className="text-xs text-muted-foreground">{catRevPct.toFixed(1)}% del total</p>
            </div>
            <div className="rounded-lg bg-card border border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Unidades vendidas</p>
              <p className="text-lg font-semibold text-foreground">{activeCatStats.quantity.toLocaleString("es-EC")}</p>
              <p className="text-xs text-muted-foreground">{catQtyPct.toFixed(1)}% del total</p>
            </div>
            <div className="rounded-lg bg-card border border-border px-3 py-2.5 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">Valor por unidad</p>
              <p className="text-lg font-semibold text-foreground">
                {activeCatStats.quantity > 0 ? `$${fmt(activeCatStats.revenue / activeCatStats.quantity)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {displayProducts.filter(p => p.category === activeCat).length} producto(s)
              </p>
            </div>
          </div>

          {/* Barra de participación */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Participación en ingresos</span>
              <span className="font-medium text-foreground">{catRevPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(catRevPct, 100)}%`, background: activeCatColor }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Gráficos ── */}
      <div className={[
        "grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity duration-200",
        loading ? "opacity-60" : "opacity-100",
      ].join(" ")}>
        <WeeklyTrendChart data={displayTrend} />
        <CategoryChart
          data={activeCat === "todas" ? displayCategoryStats : displayCategoryStats.filter(c => c.category === activeCat)}
        />
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectionInsight
          currentMonthTotal={data.currentMonthTotal}
          projectedMonthTotal={data.projectedMonthTotal}
          prevMonthTotal={data.prevMonthTotal}
          monthProgressPct={data.monthProgressPct}
          dayOfMonth={data.dayOfMonth}
          daysInMonth={data.daysInMonth}
          bestDay={data.bestDay}
          worstDay={data.worstDay}
          daysRecorded={data.daysRecorded}
        />
        <TopProductsList
          products={displayProducts}
          activeCategory={activeCat}
        />
      </div>
    </div>
  )
}
