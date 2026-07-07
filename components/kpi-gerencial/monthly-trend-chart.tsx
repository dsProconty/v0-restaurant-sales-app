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
import type { MonthlyTrendPoint } from "@/lib/kpi-gerencial"

const COLOR_MUTED = "#B8B2A6"
const COLOR_CURR = "#E85D04"

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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">📈</div>
      <p className="text-sm font-medium">Sin datos en este período</p>
    </div>
  )
}

interface Props {
  data: MonthlyTrendPoint[]
  highlightMonth: string
}

export function MonthlyTrendChart({ data, highlightMonth }: Props) {
  const hasData = data.some((d) => d.total > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolución mensual de ingresos</CardTitle>
        <CardDescription>Últimos {data.length || 6} meses</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                tickFormatter={(v) => `$${v}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.month} fill={d.month === highlightMonth ? COLOR_CURR : COLOR_MUTED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
