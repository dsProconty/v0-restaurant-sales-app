"use client"

import { useState, useMemo } from "react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import type { ReportData } from "@/app/reports/page"
import { KpiCard } from "@/components/reports/kpi-card"
import { WeeklyTrendChart } from "@/components/reports/weekly-trend-chart"
import { CategoryChart } from "@/components/reports/category-chart"
import { ProjectionInsight } from "@/components/reports/projection-insight"
import { TopProductsList } from "@/components/reports/top-products-list"
import { DateRangeSelector, type DateRange } from "@/components/reports/date-range-selector"
import { DollarSign, Calendar, TrendingUp, BarChart3 } from "lucide-react"

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

  // Categories derived from data
  const categories = useMemo(() => {
    const cats = data.categoryStats.map(c => c.category)
    log("Categorías disponibles", cats)
    return cats
  }, [data.categoryStats])

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    if (activeCat === "todas") return data.topProducts
    return data.topProducts.filter(p => p.category === activeCat)
  }, [data.topProducts, activeCat])

  // Filter chart data by active category (last7days stays global; category chart filtered)
  const filteredCategoryStats = useMemo(() => {
    if (activeCat === "todas") return data.categoryStats
    return data.categoryStats.filter(c => c.category === activeCat)
  }, [data.categoryStats, activeCat])

  // KPI values depending on selected range
  const kpis = useMemo(() => {
    log("Calculando KPIs para rango", activeRange)
    switch (activeRange) {
      case "hoy":
        return {
          primary: { label: "Hoy", value: `$${fmt(data.todayTotal)}`, change: data.dayOverDayChange, hint: "vs ayer" },
          secondary: { label: "Esta semana", value: `$${fmt(data.currentWeekTotal)}`, change: data.weekOverWeekChange, hint: "vs semana anterior" },
          tertiary: { label: "Este mes", value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`, change: null, hint: `${data.daysRecorded} días registrados` },
        }
      case "semana":
        return {
          primary: { label: "Esta semana", value: `$${fmt(data.currentWeekTotal)}`, change: data.weekOverWeekChange, hint: "vs semana anterior" },
          secondary: { label: "Este mes", value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior" },
          tertiary: { label: "Hoy", value: `$${fmt(data.todayTotal)}`, change: data.dayOverDayChange, hint: "vs ayer" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`, change: null, hint: `${data.daysRecorded} días registrados` },
        }
      default: // mes
        return {
          primary: { label: "Este mes", value: `$${fmt(data.currentMonthTotal)}`, change: data.monthOverMonthChange, hint: "vs mes anterior", highlight: true },
          secondary: { label: "Esta semana", value: `$${fmt(data.currentWeekTotal)}`, change: data.weekOverWeekChange, hint: "vs semana anterior" },
          tertiary: { label: "Hoy", value: `$${fmt(data.todayTotal)}`, change: data.dayOverDayChange, hint: "vs ayer" },
          quaternary: { label: "Promedio diario", value: `$${fmt(data.avgDailySales)}`, change: null, hint: `${data.daysRecorded} días registrados` },
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

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis de ventas e información de rendimiento
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeSelector active={activeRange} onChange={handleRangeChange} />

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* Category tabs */}
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

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label={kpis.primary.label}
          value={kpis.primary.value}
          change={kpis.primary.change ?? undefined}
          hint={kpis.primary.hint}
          icon={<DollarSign className="h-4 w-4" />}
          highlight={"highlight" in kpis.primary && kpis.primary.highlight === true}
        />
        <KpiCard
          label={kpis.secondary.label}
          value={kpis.secondary.value}
          change={kpis.secondary.change ?? undefined}
          hint={kpis.secondary.hint}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label={kpis.tertiary.label}
          value={kpis.tertiary.value}
          change={kpis.tertiary.change ?? undefined}
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

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyTrendChart data={data.last7Days} />
        <CategoryChart data={filteredCategoryStats} />
      </div>

      {/* ── Bottom row ── */}
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
