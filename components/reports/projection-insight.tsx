"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { TrendingUp, TrendingDown, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[ProjectionInsight]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  currentMonthTotal: number
  projectedMonthTotal: number
  prevMonthTotal: number
  monthProgressPct: number
  dayOfMonth: number
  daysInMonth: number
  bestDay: { date: string; amount: number } | null
  worstDay: { date: string; amount: number } | null
  daysRecorded: number
}

function fmt(n: number) {
  return n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ProjectionInsight({
  currentMonthTotal,
  projectedMonthTotal,
  prevMonthTotal,
  monthProgressPct,
  dayOfMonth,
  daysInMonth,
  bestDay,
  worstDay,
  daysRecorded,
}: Props) {
  log("Render", { projectedMonthTotal, monthProgressPct, daysRecorded })

  const vsLastMonth = prevMonthTotal > 0
    ? ((projectedMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
    : null

  const progressVsMeta = prevMonthTotal > 0
    ? Math.min(Math.round((currentMonthTotal / prevMonthTotal) * 100), 100)
    : monthProgressPct

  const hasData = daysRecorded > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#E85D04]" />
          <CardTitle className="text-base">Proyección de cierre de mes</CardTitle>
        </div>
        <CardDescription>
          Basada en promedio diario actual · {dayOfMonth} de {daysInMonth} días
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="text-4xl mb-3 opacity-30">🎯</div>
            <p className="text-sm font-medium">Sin datos suficientes</p>
            <p className="text-xs mt-1">Registra al menos un día de ventas</p>
          </div>
        ) : (
          <>
            {/* Projected total */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Proyección estimada</p>
                <p className="text-3xl font-bold text-[#E85D04]">${fmt(projectedMonthTotal)}</p>
              </div>
              {vsLastMonth !== null && (
                <span className={[
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mb-1",
                  vsLastMonth >= 0
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                ].join(" ")}>
                  {vsLastMonth >= 0
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />}
                  {vsLastMonth >= 0 ? "+" : ""}{vsLastMonth.toFixed(1)}% vs mes anterior
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Acumulado: ${fmt(currentMonthTotal)}</span>
                <span>{progressVsMeta}% de la meta</span>
              </div>
              <Progress value={progressVsMeta} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>Meta: ${fmt(prevMonthTotal > 0 ? prevMonthTotal : projectedMonthTotal)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              <div className="flex justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">Días transcurridos</span>
                <span className="font-medium">{dayOfMonth} / {daysInMonth}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">Días con ventas</span>
                <span className="font-medium">{daysRecorded}</span>
              </div>
              {bestDay && (
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" /> Mejor día
                  </span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    ${fmt(bestDay.amount)} —{" "}
                    {format(new Date(bestDay.date + "T12:00:00"), "d MMM", { locale: es })}
                  </span>
                </div>
              )}
              {worstDay && (
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-muted-foreground" /> Día más lento
                  </span>
                  <span className="font-medium text-muted-foreground">
                    ${fmt(worstDay.amount)} —{" "}
                    {format(new Date(worstDay.date + "T12:00:00"), "d MMM", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
