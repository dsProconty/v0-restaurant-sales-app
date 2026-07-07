"use client"

import { MoveUpRight, MoveDownRight, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface Props {
  label: string
  prevValue: string
  currValue: string
  change: number | null   // null = sin período anterior para comparar
  hint?: string
  icon?: ReactNode
}

export function ComparisonKpiCard({ label, prevValue, currValue, change, hint, icon }: Props) {
  const isUp = change !== null && change > 0
  const isDown = change !== null && change < 0
  const isFlat = change !== null && change === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          {prevValue && <span className="text-sm text-muted-foreground">{prevValue}</span>}
          {prevValue && <span className="text-muted-foreground text-xs">→</span>}
          <span className="text-xl font-bold text-foreground">{currValue}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {change !== null && (
            <span
              className={[
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                isUp ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "",
                isDown ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "",
                isFlat ? "bg-muted text-muted-foreground" : "",
              ].join(" ")}
            >
              {isUp && <MoveUpRight className="h-3 w-3" />}
              {isDown && <MoveDownRight className="h-3 w-3" />}
              {isFlat && <Minus className="h-3 w-3" />}
              {isUp ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
