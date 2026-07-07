"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { ProductStat } from "@/lib/kpi-gerencial"

interface Row {
  name: string
  category: string
  prevQty: number
  currQty: number
  prevRevenue: number
  currRevenue: number
}

interface CategoryGroup {
  category: string
  products: Row[]
  prevRevenue: number
  currRevenue: number
  prevQty: number
  currQty: number
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
  return Object.values(map)
}

function groupByCategory(rows: Row[]): CategoryGroup[] {
  const map: Record<string, CategoryGroup> = {}
  for (const r of rows) {
    if (!map[r.category]) {
      map[r.category] = { category: r.category, products: [], prevRevenue: 0, currRevenue: 0, prevQty: 0, currQty: 0 }
    }
    const g = map[r.category]
    g.products.push(r)
    g.prevRevenue += r.prevRevenue
    g.currRevenue += r.currRevenue
    g.prevQty += r.prevQty
    g.currQty += r.currQty
  }

  const groups = Object.values(map)
  for (const g of groups) {
    g.products.sort((a, b) => {
      const varA = pctChange(a.prevRevenue, a.currRevenue)
      const varB = pctChange(b.prevRevenue, b.currRevenue)
      return (varB ?? Infinity) - (varA ?? Infinity)
    })
  }

  return groups.sort((a, b) => {
    const varA = pctChange(a.prevRevenue, a.currRevenue)
    const varB = pctChange(b.prevRevenue, b.currRevenue)
    return Math.abs(varB ?? 999) - Math.abs(varA ?? 999)
  })
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs font-semibold text-[#3266AD]">Nuevo</span>
  }
  const isUp = pct > 0
  const isDown = pct < 0
  return (
    <span className={[
      "text-xs font-semibold whitespace-nowrap",
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
  const groups = useMemo(() => groupByCategory(mergeProducts(prevStats, currStats)), [prevStats, currStats])
  const defaultOpen = groups.length > 0 ? [groups[0].category] : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle por producto</CardTitle>
        <CardDescription>
          Unidades e ingresos por categoría, {prevLabel} vs {currLabel} — toca una categoría para ver sus productos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <Accordion type="multiple" defaultValue={defaultOpen}>
            {groups.map((g) => {
              const change = pctChange(g.prevRevenue, g.currRevenue)
              return (
                <AccordionItem key={g.category} value={g.category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-foreground truncate">{g.category}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {g.products.length} producto{g.products.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {fmtMoney(g.prevRevenue)} → <span className="text-foreground font-medium">{fmtMoney(g.currRevenue)}</span>
                        </span>
                        <DeltaBadge pct={change} />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="pb-2 pr-3 font-medium">Producto</th>
                            <th className="pb-2 px-3 font-medium text-right">{prevLabel} (u)</th>
                            <th className="pb-2 px-3 font-medium text-right">{prevLabel} ($)</th>
                            <th className="pb-2 px-3 font-medium text-right">{currLabel} (u)</th>
                            <th className="pb-2 px-3 font-medium text-right">{currLabel} ($)</th>
                            <th className="pb-2 pl-3 font-medium text-right">Var.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.products.map((r) => (
                            <tr key={`${r.name}__${r.category}`} className="border-t border-border">
                              <td className="py-2 pr-3 font-medium text-foreground">{r.name}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{r.prevQty.toLocaleString("es-EC")}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{fmtMoney(r.prevRevenue)}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{r.currQty.toLocaleString("es-EC")}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{fmtMoney(r.currRevenue)}</td>
                              <td className="py-2 pl-3 text-right">
                                <DeltaBadge pct={pctChange(r.prevRevenue, r.currRevenue)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
