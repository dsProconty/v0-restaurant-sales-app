"use client"

import { useCallback, useMemo, useState } from "react"
import { format, subMonths } from "date-fns"
import { DollarSign, ShoppingBag, Receipt, Award, Loader2 } from "lucide-react"
import type { KpiGerencialData } from "@/lib/kpi-gerencial"
import { MonthSelect } from "@/components/kpi-gerencial/month-select"
import { ComparisonKpiCard } from "@/components/kpi-gerencial/comparison-kpi-card"
import { CategoryComparisonChart } from "@/components/kpi-gerencial/category-comparison-chart"
import { MonthlyTrendChart } from "@/components/kpi-gerencial/monthly-trend-chart"
import { ProductComparisonTable } from "@/components/kpi-gerencial/product-comparison-table"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[KpiGerencialDashboard]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

type Preset = "anterior" | "anioPasado" | "historial" | "personalizado"

function fmtMoney(n: number) {
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pctChange(prev: number, curr: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

interface Props {
  initialData: KpiGerencialData
}

export function KpiGerencialDashboard({ initialData }: Props) {
  const [monthA, setMonthA] = useState(initialData.monthA.month)
  const [monthB, setMonthB] = useState(initialData.monthB.month)
  const [preset, setPreset] = useState<Preset>("anterior")
  const [data, setData] = useState<KpiGerencialData>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchComparison = useCallback(async (a: string, b: string, trendStart?: string) => {
    log("Fetch iniciado", { a, b, trendStart })
    setLoading(true)
    try {
      const params = new URLSearchParams({ monthA: a, monthB: b })
      if (trendStart) params.set("trendStart", trendStart)
      const res = await fetch(`/api/kpi-gerencial?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: KpiGerencialData = await res.json()
      setData(json)
      log("Fetch OK", { totalA: json.monthA.total, totalB: json.monthB.total })
    } catch (err) {
      logError("Fetch falló", err)
    } finally {
      setLoading(false)
    }
  }, [])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === "personalizado") return

    if (p === "historial") {
      const months = [...data.availableMonths].sort()
      if (months.length === 0) return
      const oldest = months[0]
      const newest = months[months.length - 1]
      setMonthA(oldest)
      setMonthB(newest)
      fetchComparison(oldest, newest, oldest)
      return
    }

    const bDate = new Date(`${monthB}-01T12:00:00`)
    const aDate = p === "anterior" ? subMonths(bDate, 1) : subMonths(bDate, 12)
    const a = format(aDate, "yyyy-MM")
    setMonthA(a)
    fetchComparison(a, monthB)
  }

  function handleMonthAChange(value: string) {
    setPreset("personalizado")
    setMonthA(value)
    fetchComparison(value, monthB)
  }

  function handleMonthBChange(value: string) {
    setMonthB(value)
    if (preset === "personalizado" || preset === "historial") {
      setPreset("personalizado")
      fetchComparison(monthA, value)
      return
    }
    const bDate = new Date(`${value}-01T12:00:00`)
    const aDate = preset === "anterior" ? subMonths(bDate, 1) : subMonths(bDate, 12)
    const a = format(aDate, "yyyy-MM")
    setMonthA(a)
    fetchComparison(a, value)
  }

  const { monthA: a, monthB: b, trend, availableMonths } = data

  const revenueChange = pctChange(a.total, b.total)
  const unitsChange = pctChange(a.unitsTotal, b.unitsTotal)
  const ticketChange = pctChange(a.avgTicket, b.avgTicket)

  const bestGrowthCategory = useMemo(() => {
    let best: { category: string; change: number } | null = null
    for (const catA of a.categoryStats) {
      if (catA.revenue <= 0) continue
      const catB = b.categoryStats.find((c) => c.category === catA.category)
      const change = pctChange(catA.revenue, catB?.revenue ?? 0)
      if (change === null) continue
      if (!best || change > best.change) best = { category: catA.category, change }
    }
    return best
  }, [a.categoryStats, b.categoryStats])

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">KPI Gerencial</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comparativo de ventas mes a mes — ingresos, unidades vendidas y productos por categoría
        </p>
      </div>

      {/* ── Selector de comparación ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
            <span className="text-xs text-muted-foreground pl-1">Comparar</span>
            <MonthSelect value={monthA} months={availableMonths} onChange={handleMonthAChange} disabled={loading} />
            <span className="text-xs text-muted-foreground font-medium">vs</span>
            <MonthSelect value={monthB} months={availableMonths} onChange={handleMonthBChange} disabled={loading} accent />
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Actualizando...
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: "anterior", label: "Mes anterior" },
            { key: "anioPasado", label: "Mismo mes, año pasado" },
            { key: "historial", label: "Todo el historial" },
            { key: "personalizado", label: "Personalizado" },
          ] as { key: Preset; label: string }[]).map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              disabled={loading}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50",
                preset === p.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "historial" && availableMonths.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Comparando el primer mes con ventas registradas ({a.label}) contra el más reciente ({b.label}) — el gráfico de evolución muestra todos los meses de por medio.
          </p>
        )}
      </div>

      {/* ── KPIs comparativos ── */}
      <div className={[
        "grid grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity duration-200",
        loading ? "opacity-60" : "opacity-100",
      ].join(" ")}>
        <ComparisonKpiCard
          label="Ingresos totales"
          prevValue={fmtMoney(a.total)}
          currValue={fmtMoney(b.total)}
          change={revenueChange}
          hint={`${a.label} → ${b.label}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <ComparisonKpiCard
          label="Unidades vendidas"
          prevValue={a.unitsTotal.toLocaleString("es-EC")}
          currValue={b.unitsTotal.toLocaleString("es-EC")}
          change={unitsChange}
          hint="Todas las categorías"
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <ComparisonKpiCard
          label="Ticket promedio"
          prevValue={fmtMoney(a.avgTicket)}
          currValue={fmtMoney(b.avgTicket)}
          change={ticketChange}
          hint="Ingreso ÷ unidades"
          icon={<Receipt className="h-4 w-4" />}
        />
        <ComparisonKpiCard
          label="Mayor crecimiento"
          prevValue=""
          currValue={bestGrowthCategory?.category ?? "—"}
          change={bestGrowthCategory?.change ?? null}
          hint="Categoría destacada del mes"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      {/* ── Gráficos comparativos ── */}
      <div className={[
        "grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity duration-200",
        loading ? "opacity-60" : "opacity-100",
      ].join(" ")}>
        <CategoryComparisonChart
          title="Ingresos por categoría"
          description={`${a.label} vs ${b.label}`}
          prevLabel={a.label}
          currLabel={b.label}
          prevStats={a.categoryStats}
          currStats={b.categoryStats}
          metric="revenue"
        />
        <CategoryComparisonChart
          title="Unidades vendidas por categoría"
          description={`${a.label} vs ${b.label}`}
          prevLabel={a.label}
          currLabel={b.label}
          prevStats={a.categoryStats}
          currStats={b.categoryStats}
          metric="quantity"
        />
      </div>

      {/* ── Evolución mensual ── */}
      <MonthlyTrendChart data={trend} highlightMonth={b.month} />

      {/* ── Detalle por producto ── */}
      <ProductComparisonTable
        prevLabel={a.label}
        currLabel={b.label}
        prevStats={a.productStats}
        currStats={b.productStats}
      />
    </div>
  )
}
