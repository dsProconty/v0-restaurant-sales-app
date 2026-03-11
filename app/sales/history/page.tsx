import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronRight, FileText, TrendingUp, Plus } from "lucide-react"

async function getSalesHistory() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("daily_sales")
    .select(`
      id, sale_date, total_revenue, notes,
      sales_items ( id, quantity, subtotal )
    `)
    .order("sale_date", { ascending: false })
    .limit(100)
  return sales || []
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default async function SalesHistoryPage() {
  const sales = await getSalesHistory()

  const salesByMonth: Record<string, typeof sales> = {}
  for (const sale of sales) {
    const monthKey = format(new Date(sale.sale_date + "T12:00:00"), "MMMM yyyy", { locale: es })
    if (!salesByMonth[monthKey]) salesByMonth[monthKey] = []
    salesByMonth[monthKey].push(sale)
  }

  const grandTotal = sales.reduce((sum, s) => sum + (s.total_revenue || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Historial de Ventas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sales.length} día{sales.length !== 1 ? "s" : ""} registrado{sales.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button asChild className="h-10 rounded-xl shrink-0">
            <Link href="/sales/new">
              <Plus className="h-4 w-4 mr-1.5" /> Nueva Venta
            </Link>
          </Button>
        </div>

        {/* Stats banner */}
        {sales.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-2xl bg-primary px-5 py-4">
              <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-1">Total acumulado</p>
              <p className="text-2xl font-bold text-primary-foreground">${grandTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Promedio diario</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${(grandTotal / (sales.length || 1)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {sales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Sin ventas registradas</h3>
            <p className="text-sm text-muted-foreground mb-5">Comienza registrando las ventas de hoy</p>
            <Button asChild className="rounded-xl">
              <Link href="/sales/new">Registrar Primera Venta</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(salesByMonth).map(([month, monthSales]) => {
              const monthTotal = monthSales.reduce((sum, s) => sum + (s.total_revenue || 0), 0)
              return (
                <div key={month}>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-bold text-foreground capitalize">{month}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{monthSales.length} día{monthSales.length !== 1 ? "s" : ""}</span>
                      <span className="text-sm font-bold text-primary">
                        ${monthTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Sales list */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {monthSales.map((sale) => {
                      const itemCount = sale.sales_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                      const dayName = format(new Date(sale.sale_date + "T12:00:00"), "EEEE", { locale: es })
                      const dayNum = format(new Date(sale.sale_date + "T12:00:00"), "d")
                      const monthShort = format(new Date(sale.sale_date + "T12:00:00"), "MMM", { locale: es })

                      return (
                        <Link
                          key={sale.id}
                          href={`/sales/${sale.id}`}
                          className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 group"
                        >
                          {/* Date badge */}
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-muted shrink-0">
                            <span className="text-lg font-bold text-foreground leading-none">{dayNum}</span>
                            <span className="text-xs text-muted-foreground capitalize">{monthShort}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground capitalize">{dayName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {itemCount} artículo{itemCount !== 1 ? "s" : ""}
                              </span>
                              {sale.notes && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <FileText className="h-3 w-3 text-muted-foreground/60" />
                                  <span className="text-xs text-muted-foreground truncate max-w-32">
                                    {sale.notes.slice(0, 28)}{sale.notes.length > 28 ? "…" : ""}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-bold text-foreground">
                              ${sale.total_revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
