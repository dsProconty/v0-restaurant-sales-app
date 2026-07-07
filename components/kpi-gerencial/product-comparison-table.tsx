"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductStat } from "@/lib/kpi-gerencial"

interface Row {
  name: string
  category: string
  prevQty: number
  currQty: number
  prevRevenue: number
  currRevenue: number
}

// null = "nuevo" (no existía en el período anterior)
function pctChange(prev: number, curr: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

function mergeProducts(prevStats: ProductStat[], currStats: ProductStat[]): Row[] {
  const map: Record<string, Row> = {}
  for (const p of prevStats) {
    const key = `${p.name}__${p.category}`
    map[key] = { name: p.name, category: p.category, prevQty: p.quantity, currQty: 0, prevRevenue: p.revenue, currRevenue: 0 }
  }
  for (const p of currStats) {
    const key = `${p.name}__${p.category}`
    if (!map[key]) map[key] = { name: p.name, category: p.category, prevQty: 0, currQty: 0, prevRevenue: 0, currRevenue: 0 }
    map[key].currQty = p.quantity
    map[key].currRevenue = p.revenue
  }
  return Object.values(map).sort((a, b) => {
    const varA = pctChange(a.prevRevenue, a.currRevenue)
    const varB = pctChange(b.prevRevenue, b.currRevenue)
    return (varB ?? Infinity) - (varA ?? Infinity)
  })
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs font-semibold text-[#3266AD]">Nuevo</span>
  }
  const isUp = pct > 0
  const isDown = pct < 0
  return (
    <span className={[
      "text-xs font-semibold",
      isUp ? "text-green-700 dark:text-green-400" : "",
      isDown ? "text-red-700 dark:text-red-400" : "",
      !isUp && !isDown ? "text-muted-foreground" : "",
    ].join(" ")}>
      {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[160px] text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">🧾</div>
      <p className="text-sm font-medium">Sin productos vendidos en estos meses</p>
    </div>
  )
}

interface Props {
  prevLabel: string
  currLabel: string
  prevStats: ProductStat[]
  currStats: ProductStat[]
}

export function ProductComparisonTable({ prevLabel, currLabel, prevStats, currStats }: Props) {
  const rows = mergeProducts(prevStats, currStats)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle por producto</CardTitle>
        <CardDescription>
          Unidades e ingresos, {prevLabel} vs {currLabel} — ordenado por mayor variación
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Producto</th>
                  <th className="pb-2 pr-3 font-medium">Categoría</th>
                  <th className="pb-2 px-3 font-medium text-right">{prevLabel} (u)</th>
                  <th className="pb-2 px-3 font-medium text-right">{currLabel} (u)</th>
                  <th className="pb-2 px-3 font-medium text-right">{prevLabel} ($)</th>
                  <th className="pb-2 px-3 font-medium text-right">{currLabel} ($)</th>
                  <th className="pb-2 pl-3 font-medium text-right">Var.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.name}__${r.category}`} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium text-foreground">{r.name}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.prevQty.toLocaleString("es-EC")}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.currQty.toLocaleString("es-EC")}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      ${r.prevRevenue.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      ${r.currRevenue.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <DeltaBadge pct={pctChange(r.prevRevenue, r.currRevenue)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
