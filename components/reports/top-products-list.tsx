"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductStat } from "@/app/reports/page"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[TopProductsList]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  products: ProductStat[]
  activeCategory: string
}

function fmt(n: number) {
  return n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ category }: { category: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">🍽️</div>
      <p className="text-sm font-medium">Sin productos para mostrar</p>
      <p className="text-xs mt-1">
        {category === "todas"
          ? "Registra ventas para ver el ranking"
          : `No hay ventas en la categoría "${category}"`}
      </p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TopProductsList({ products, activeCategory }: Props) {
  log("Render", { count: products.length, activeCategory })

  const maxRevenue = products[0]?.revenue ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Productos más vendidos</CardTitle>
        <CardDescription>
          Este mes{activeCategory !== "todas" ? ` · ${activeCategory}` : " · todas las categorías"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => {
              const pct = Math.round((product.revenue / maxRevenue) * 100)
              const isTop3 = index < 3
              return (
                <div key={product.name}>
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <span className={[
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      isTop3
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}>
                      {index + 1}
                    </span>

                    {/* Name & meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} vendidos
                        {product.category && ` · ${product.category}`}
                      </p>
                    </div>

                    {/* Revenue */}
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      ${fmt(product.revenue)}
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="ml-9 mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E85D04] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
