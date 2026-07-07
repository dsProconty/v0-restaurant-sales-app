"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthCategoryBreakdown } from "@/lib/kpi-gerencial"

// ─── Paleta: un color fijo por mes (mismo orden que ya usa la app para categorías) ─
const MONTH_COLORS = [
  "#3266AD", "#0F6E56", "#639922", "#854F0B", "#7F77DD",
  "#993556", "#1D9E75", "#D85A30", "#888780", "#E85D04",
]

function compactLabel(n: number, metric: "revenue" | "quantity") {
  if (metric === "quantity") return n.toLocaleString("es-EC")
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${Math.round(n).toLocaleString("es-EC")}`
}

function mergeMonthlyCategoryStats(months: MonthCategoryBreakdown[], metric: "revenue" | "quantity") {
  const map: Record<string, Record<string, number>> = {}
  for (const m of months) {
    for (const c of m.categoryStats) {
      if (!map[c.category]) map[c.category] = {}
      map[c.category][m.month] = c[metric]
    }
  }
  const rows = Object.entries(map).map(([category, values]) => ({ category, ...values }))
  return rows.sort((a, b) => {
    const totalA = months.reduce((s, m) => s + ((a[m.month] as number) ?? 0), 0)
    const totalB = months.reduce((s, m) => s + ((b[m.month] as number) ?? 0), 0)
    return totalB - totalA
  })
}

function CustomTooltip({ active, payload, label, months, valueFmt }: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
  months: MonthCategoryBreakdown[]
  valueFmt: (n: number) => string
}) {
  if (!active || !payload?.length) return null
  const byMonth = new Map(payload.map((p) => [p.dataKey, p.value]))
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {months.map((m) => {
        const v = byMonth.get(m.month)
        if (v === undefined || v === 0) return null
        return (
          <p key={m.month} className="font-semibold text-foreground">
            {m.label}: {valueFmt(v)}
          </p>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">📊</div>
      <p className="text-sm font-medium">Sin datos para comparar</p>
    </div>
  )
}

interface Props {
  title: string
  description: string
  months: MonthCategoryBreakdown[]
  metric: "revenue" | "quantity"
}

export function CategoryMultiMonthChart({ title, description, months, metric }: Props) {
  const data = mergeMonthlyCategoryStats(months, metric)
  const hasData = data.some((row) => months.some((m) => ((row[m.month] as number) ?? 0) > 0))
  const perCategoryWidth = Math.max(70, months.length * 22 + 24)
  const naturalWidth = data.length * perCategoryWidth
  const chartWidth = Math.max(560, naturalWidth) + 160
  const mayNeedScroll = naturalWidth > 600

  const valueFmt = (n: number) =>
    metric === "revenue"
      ? `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : n.toLocaleString("es-EC")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
              {months.map((m, i) => (
                <span key={m.month} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm"
                    style={{ background: MONTH_COLORS[i % MONTH_COLORS.length] }}
                  />
                  {m.label}
                </span>
              ))}
            </div>
            <div className="chart-scroll">
              <div style={{ width: chartWidth }}>
                <ResponsiveContainer width="100%" height={310}>
                  <BarChart data={data} margin={{ top: 22, right: 70, left: 0, bottom: 0 }} barGap={3} barCategoryGap="16%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="category"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={54}
                      tick={{ fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, (max: number) => Math.ceil(max * 1.3)]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (metric === "revenue" ? `$${v}` : `${v}`)}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip months={months} valueFmt={valueFmt} />} />
                    {months.map((m, i) => (
                      <Bar
                        key={m.month}
                        dataKey={m.month}
                        name={m.label}
                        fill={MONTH_COLORS[i % MONTH_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={16}
                      >
                        <LabelList
                          dataKey={m.month}
                          position="top"
                          formatter={(v: number) => (v > 0 ? compactLabel(v, metric) : "")}
                          style={{ fontSize: 8.5, fontWeight: 600, fill: "hsl(var(--foreground))" }}
                        />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {mayNeedScroll && (
              <p className="text-[11px] text-muted-foreground mt-1 text-right">← desliza para ver más →</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
