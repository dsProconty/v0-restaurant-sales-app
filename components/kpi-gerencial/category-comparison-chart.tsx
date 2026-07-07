"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategoryStat } from "@/lib/kpi-gerencial"

// ─── Colores fijos: mes anterior vs mes actual (no varían por categoría) ────
const COLOR_PREV = "#3266AD"
const COLOR_CURR = "#E85D04"

interface Row {
  category: string
  prev: number
  curr: number
}

function mergeCategoryStats(
  prevStats: CategoryStat[],
  currStats: CategoryStat[],
  metric: "revenue" | "quantity",
): Row[] {
  const map: Record<string, Row> = {}
  for (const c of prevStats) {
    map[c.category] = { category: c.category, prev: c[metric], curr: 0 }
  }
  for (const c of currStats) {
    if (!map[c.category]) map[c.category] = { category: c.category, prev: 0, curr: 0 }
    map[c.category].curr = c[metric]
  }
  return Object.values(map)
    .sort((a, b) => b.curr + b.prev - (a.curr + a.prev))
    .slice(0, 8)
}

function CustomTooltip({ active, payload, label, valueFmt }: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
  valueFmt: (n: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold text-foreground">
          {p.dataKey === "prev" ? "Mes anterior: " : "Mes actual: "}
          {valueFmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">📊</div>
      <p className="text-sm font-medium">Sin datos para comparar</p>
      <p className="text-xs mt-1">Elige meses con ventas registradas</p>
    </div>
  )
}

interface Props {
  title: string
  description: string
  prevLabel: string
  currLabel: string
  prevStats: CategoryStat[]
  currStats: CategoryStat[]
  metric: "revenue" | "quantity"
}

export function CategoryComparisonChart({
  title, description, prevLabel, currLabel, prevStats, currStats, metric,
}: Props) {
  const data = mergeCategoryStats(prevStats, currStats, metric)
  const hasData = data.some((d) => d.prev > 0 || d.curr > 0)

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
            <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_PREV }} />
                {prevLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_CURR }} />
                {currLabel}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (metric === "revenue" ? `$${v}` : `${v}`)}
                  width={50}
                />
                <Tooltip content={<CustomTooltip valueFmt={valueFmt} />} />
                <Bar dataKey="prev" name={prevLabel} fill={COLOR_PREV} radius={[4, 4, 0, 0]} />
                <Bar dataKey="curr" name={currLabel} fill={COLOR_CURR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
