"use client"

import { MoveUpRight, MoveDownRight, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[KpiCard]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Props ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string
  change?: number      // percentage — positive = up, negative = down
  hint?: string        // secondary text below badge
  icon?: ReactNode
  highlight?: boolean  // "Este Mes" — larger, accented style
}

// ─── Component ───────────────────────────────────────────────────────────────
export function KpiCard({ label, value, change, hint, icon, highlight = false }: KpiCardProps) {
  log("Render", { label, value, change, highlight })

  const isUp = change !== undefined && change > 0
  const isDown = change !== undefined && change < 0
  const isFlat = change !== undefined && change === 0

  const badge = change !== undefined ? (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        isUp   ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "",
        isDown ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "",
        isFlat ? "bg-muted text-muted-foreground" : "",
      ].join(" ")}
    >
      {isUp   && <MoveUpRight className="h-3 w-3" />}
      {isDown && <MoveDownRight className="h-3 w-3" />}
      {isFlat && <Minus className="h-3 w-3" />}
      {isUp ? "+" : ""}{change.toFixed(1)}%
    </span>
  ) : null

  if (highlight) {
    return (
      <Card className="col-span-2 lg:col-span-1 border-l-4 border-l-[#E85D04] bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {icon && <span className="text-[#E85D04]">{icon}</span>}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#E85D04] mb-2">{value}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {badge}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-2">{value}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {badge}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
