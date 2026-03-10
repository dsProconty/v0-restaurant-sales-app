import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronRight, FileText } from "lucide-react"

async function getSalesHistory() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("daily_sales")
    .select(`
      id,
      sale_date,
      total_revenue,
      notes,
      sales_items (
        id,
        quantity,
        subtotal
      )
    `)
    .order("sale_date", { ascending: false })
    .limit(100)

  return sales || []
}

export default async function SalesHistoryPage() {
  const sales = await getSalesHistory()

  // Group sales by month
  const salesByMonth: Record<string, typeof sales> = {}
  for (const sale of sales) {
    const monthKey = format(new Date(sale.sale_date + "T12:00:00"), "MMMM yyyy", { locale: es })
    if (!salesByMonth[monthKey]) {
      salesByMonth[monthKey] = []
    }
    salesByMonth[monthKey].push(sale)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Historial de Ventas</h1>
              <p className="text-muted-foreground">
                Ver y administrar registros de ventas anteriores
              </p>
            </div>
            <Button asChild>
              <Link href="/sales/new">Registrar Nueva Venta</Link>
            </Button>
          </div>

          {sales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No hay ventas registradas</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza a registrar tus ventas diarias
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/sales/new">Registrar Primera Venta</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(salesByMonth).map(([month, monthSales]) => {
                const monthTotal = monthSales.reduce((sum, s) => sum + s.total_revenue, 0)
                return (
                  <Card key={month}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{month}</span>
                        <span className="text-lg font-semibold text-primary">
                          ${monthTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {monthSales.length} día{monthSales.length !== 1 ? "s" : ""} registrado{monthSales.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {monthSales.map((sale) => {
                          const itemCount = sale.sales_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                          return (
                            <Link
                              key={sale.id}
                              href={`/sales/${sale.id}`}
                              className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                  <FileText className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {format(new Date(sale.sale_date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {itemCount} artículo{itemCount !== 1 ? "s" : ""} vendido{itemCount !== 1 ? "s" : ""}
                                    {sale.notes && ` • ${sale.notes.slice(0, 30)}${sale.notes.length > 30 ? "..." : ""}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-lg font-semibold text-foreground">
                                  ${sale.total_revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
