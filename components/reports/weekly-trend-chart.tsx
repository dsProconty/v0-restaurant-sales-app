"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyPoint } from "@/app/reports/page"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[WeeklyTrendChart]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

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
      <div className="text-4xl mb-3 opacity-30">📈</div>
      <p className="text-sm font-medium">Sin datos en este período</p>
      <p className="text-xs mt-1">Registra ventas para ver la tendencia</p>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  data: DailyPoint[]
}

// ─── Component ───────────────────────────────────────────────────────────────
export function WeeklyTrendChart({ data }: Props) {
  log("Render", { points: data.length })

  const hasData = data.some(d => d.amount > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia semanal</CardTitle>
        <CardDescription>Ingresos de los últimos 7 días</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
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
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#E85D04"
                strokeWidth={2.5}
                dot={{ fill: "#E85D04", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
