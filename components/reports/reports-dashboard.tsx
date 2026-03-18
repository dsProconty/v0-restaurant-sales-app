"use client"

import { useState, useMemo } from "react"
import type { ReportData } from "@/app/reports/page"
import { KpiCard } from "@/components/reports/kpi-card"
import { WeeklyTrendChart } from "@/components/reports/weekly-trend-chart"
import { CategoryChart } from "@/components/reports/category-chart"
import { ProjectionInsight } from "@/components/reports/projection-insight"
import { TopProductsList } from "@/components/reports/top-products-list"
import { DateRangeSelector, type DateRange } from "@/components/reports/date-range-selector"
import { DollarSign, Calendar, TrendingUp, BarChart3, ShoppingBag, Percent, Hash } from "lucide-react"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[ReportsDashboard]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  data: ReportData
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ReportsDashboard({ data }: Props) {
  const [activeRange, setActiveRange] = useState<DateRange>("mes")
  const [activeCat, setActiveCat] = useState<string>("todas")

  // Categorías derivadas de los datos
  const categories = useMemo(() => {
    const cats = data.categoryStats.map(c => c.category)
    log("Categorías disponibles", cats)
    return cats
  }, [data.categoryStats])

  // Stats de la categoría activa (para KPIs de categoría)
  const activeCatStats = useMemo(() => {
    if (activeCat === "todas") return null
    const stat = data.categoryStats.find(c => c.category === activeCat) ?? null
    log("Stats de categoría activa", stat)
    return stat
  }, [data.categoryStats, activeCat])

  // Total global para calcular % de participación
  const totalRevenue = useMemo(() =>
    data.categoryStats.reduce((s, c) => s + c.revenue, 0),
    [data.categoryStats]
  )
  const totalQuantity = useMemo(() =>
    data.categoryStats.reduce((s, c) => s + c.quantity, 0),
    [data.categoryStats]
  )

  // Productos filtrados por categoría activa
  const filteredProducts = useMemo(() => {
    if (activeCat === "todas") return data.topProducts
    return data.topProducts.filter(p => p.category === activeCat)
  }, [data.topProducts, activeCat])

  // Stats del gráfico de categorías filtrados
  const filteredCategoryStats = useMemo(() => {
    if (activeCat === "todas") return data.categoryStats
    return data.categoryStats.filter(c => c.category === activeCat)
  }, [data.categoryStats, activeCat])

  // KPIs globales según rango de fecha
  const kpis = useMemo(() => {
    log("Calculando KPIs para rango", activeRange)
    switch (activeRange) {
      case "hoy":
        return {
          primary:    { label: "Hoy",           value: `$${fmt(data.todayTotal)}`,        change: data.dayOverDayChange,   hint: "vs ayer" },
          secondary:  { label: "Esta semana",   value: `$${fmt(data.currentWeekTotal)}`,  change: data.weekOverWeekChange, hint: "vs semana anterior" },
          tertiary:   { label: "Este mes",      value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`,   hint: `${data.daysRecorded} días registrados` },
        }
      case "semana":
        return {
          primary:    { label: "Esta semana",   value: `$${fmt(data.currentWeekTotal)}`,  change: data.weekOverWeekChange, hint: "vs semana anterior" },
          secondary:  { label: "Este mes",      value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior" },
          tertiary:   { label: "Hoy",           value: `$${fmt(data.todayTotal)}`,        change: data.dayOverDayChange,   hint: "vs ayer" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`,   hint: `${data.daysRecorded} días registrados` },
        }
      default: // mes
        return {
          primary:    { label: "Este mes",      value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior", highlight: true },
          secondary:  { label: "Esta semana",   value: `$${fmt(data.currentWeekTotal)}`,  change: data.weekOverWeekChange, hint: "vs semana anterior" },
          tertiary:   { label: "Hoy",           value: `$${fmt(data.todayTotal)}`,        change: data.dayOverDayChange,   hint: "vs ayer" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`,   hint: `${data.daysRecorded} días registrados` },
        }
    }
  }, [activeRange, data])

  function handleRangeChange(range: DateRange) {
    log("Rango cambiado a", range)
    setActiveRange(range)
  }

  function handleCatChange(cat: string) {
    log("Categoría filtrada a", cat)
    setActiveCat(cat)
  }

  // KPIs de categoría: ingresos, unidades y % participación
  const catRevenuePct = activeCatStats && totalRevenue > 0
    ? (activeCatStats.revenue / totalRevenue) * 100
    : 0
  const catQtyPct = activeCatStats && totalQuantity > 0
    ? (activeCatStats.quantity / totalQuantity) * 100
    : 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis de ventas e información de rendimiento
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeSelector active={activeRange} onChange={handleRangeChange} />

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* Tabs de categoría */}
        <div className="flex flex-wrap gap-2">
          {["todas", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => handleCatChange(cat)}
              className={[
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                activeCat === cat
                  ? "bg-secondary text-foreground border-border"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-muted",
              ].join(" ")}
            >
              {cat === "todas" ? "Todas" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs globales ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label={kpis.primary.label}
          value={kpis.primary.value}
          change={"change" in kpis.primary ? kpis.primary.change ?? undefined : undefined}
          hint={kpis.primary.hint}
          icon={<DollarSign className="h-4 w-4" />}
          highlight={"highlight" in kpis.primary && kpis.primary.highlight === true}
        />
        <KpiCard
          label={kpis.secondary.label}
          value={kpis.secondary.value}
          change={"change" in kpis.secondary ? kpis.secondary.change ?? undefined : undefined}
          hint={kpis.secondary.hint}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label={kpis.tertiary.label}
          value={kpis.tertiary.value}
          change={"change" in kpis.tertiary ? kpis.tertiary.change ?? undefined : undefined}
          hint={kpis.tertiary.hint}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label={kpis.quaternary.label}
          value={kpis.quaternary.value}
          hint={kpis.quaternary.hint}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* ── KPIs de categoría (solo aparecen cuando hay una categoría seleccionada) ── */}
      {activeCatStats && (
        <div>
          {/* Encabezado de sección */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-1 rounded-full bg-[#E85D04]" />
            <p className="text-sm font-medium text-foreground">
              Detalle de categoría:{" "}
              <span className="text-[#E85D04]">{activeCat}</span>
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Ingresos de la categoría */}
            <KpiCard
              label="Ingresos de categoría"
              value={`$${fmt(activeCatStats.revenue)}`}
              hint={`${catRevenuePct.toFixed(1)}% del total de ventas`}
              icon={<DollarSign className="h-4 w-4" />}
            />

            {/* Unidades vendidas */}
            <KpiCard
              label="Unidades vendidas"
              value={activeCatStats.quantity.toLocaleString("es-EC")}
              hint={`${catQtyPct.toFixed(1)}% del total de items`}
              icon={<Hash className="h-4 w-4" />}
            />

            {/* Ticket promedio por unidad */}
            <KpiCard
              label="Valor promedio por item"
              value={activeCatStats.quantity > 0
                ? `$${fmt(activeCatStats.revenue / activeCatStats.quantity)}`
                : "$0.00"
              }
              hint={`${activeCatStats.quantity} items · ${filteredProducts.length} producto${filteredProducts.length !== 1 ? "s" : ""}`}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
          </div>

          {/* Barra de participación visual */}
          <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Participación en ingresos totales</span>
              <span className="font-medium text-foreground">{catRevenuePct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E85D04] transition-all duration-500"
                style={{ width: `${Math.min(catRevenuePct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$0</span>
              <span>Total: ${fmt(totalRevenue)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyTrendChart data={data.last7Days} />
        <CategoryChart data={filteredCategoryStats} />
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
          products={filteredProducts}
          activeCategory={activeCat}
        />
      </div>
    </div>
  )
}
