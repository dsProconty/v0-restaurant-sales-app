"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategoryStat } from "@/app/reports/page"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[CategoryChart]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Palette ─────────────────────────────────────────────────────────────────
const COLORS = ["#E85D04", "#3266AD", "#3B6D11", "#9333EA", "#0E7490", "#B45309"]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-sm">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">
        ${payload[0].value.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">📊</div>
      <p className="text-sm font-medium">Sin datos de categorías</p>
      <p className="text-xs mt-1">Registra ventas con productos categorizados</p>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  data: CategoryStat[]
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CategoryChart({ data }: Props) {
  log("Render", { categories: data.length })

  const totalRevenue = data.reduce((s, c) => s + c.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas por categoría</CardTitle>
        <CardDescription>Distribución de ingresos este mes</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-3">
              {data.map((cat, i) => {
                const pct = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(0) : "0"
                return (
                  <span key={cat.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {cat.category} {pct}%
                  </span>
                )
              })}
            </div>

            <ResponsiveContainer width="100%" height={220}>
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
                  tickFormatter={v => `$${v}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
