import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PlusCircle, TrendingUp, Package, Calendar, CheckCircle2 } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date()
  const startOfCurrentMonth = startOfMonth(today)
  const endOfCurrentMonth = endOfMonth(today)

  // Get today's sales
  const { data: todaySales } = await supabase
    .from("daily_sales")
    .select("id, total_revenue")
    .eq("sale_date", format(today, "yyyy-MM-dd"))
    .maybeSingle()

  // Get this month's sales
  const { data: monthSales } = await supabase
    .from("daily_sales")
    .select("total_revenue")
    .gte("sale_date", format(startOfCurrentMonth, "yyyy-MM-dd"))
    .lte("sale_date", format(endOfCurrentMonth, "yyyy-MM-dd"))

  const monthTotal = monthSales?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0
  const daysWithSales = monthSales?.length || 0
  const avgDaily = daysWithSales > 0 ? monthTotal / daysWithSales : 0

  // Get last 7 days sales for trend
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), "yyyy-MM-dd"))
  const { data: weekSales } = await supabase
    .from("daily_sales")
    .select("sale_date, total_revenue")
    .in("sale_date", last7Days)
    .order("sale_date", { ascending: true })

  // Get product count
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Get recent sales
  const { data: recentSales } = await supabase
    .from("daily_sales")
    .select("id, sale_date, total_revenue, notes")
    .order("sale_date", { ascending: false })
    .limit(5)

  return {
    todayTotal: todaySales?.total_revenue || 0,
    todayRegistered: !!todaySales,
    todaySaleId: todaySales?.id || null,
    monthTotal,
    avgDaily,
    productCount: productCount || 0,
    weekSales: weekSales || [],
    recentSales: recentSales || [],
    last7Days,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel de Control</h1>
              <p className="text-muted-foreground">
                Resumen de las ventas de tu restaurante
              </p>
            </div>
            <div className="flex items-center gap-3">
              {data.todayRegistered ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ventas de hoy registradas</span>
                  <Link href={`/sales/${data.todaySaleId}`} className="underline font-medium">
                    Ver
                  </Link>
                </div>
              ) : (
                <Button asChild>
                  <Link href="/sales/new" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Registrar Ventas de Hoy
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ventas de Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.todayTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
                  {data.todayRegistered && (
                    <Badge variant="secondary" className="text-xs py-0 bg-green-100 text-green-700">✓ Registrado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.monthTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(), "MMMM yyyy", { locale: es })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Diario</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.avgDaily.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Basado en {data.monthTotal > 0 ? Math.round(data.monthTotal / data.avgDaily) : 0} días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Productos Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{data.productCount}</div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/products" className="text-primary hover:underline">Administrar productos</Link>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Últimos 7 Días</CardTitle>
                <CardDescription>Tendencia de ventas diarias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.last7Days.map((date) => {
                    const sale = data.weekSales.find((s) => s.sale_date === date)
                    const amount = sale?.total_revenue || 0
                    const maxAmount = Math.max(...data.weekSales.map((s) => s.total_revenue || 0), 1)
                    const percentage = (amount / maxAmount) * 100
                    const isToday = date === format(new Date(), "yyyy-MM-dd")
                    return (
                      <div key={date} className="flex items-center gap-3">
                        <div className={`w-16 text-sm ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                          {format(new Date(date + "T12:00:00"), "EEE", { locale: es })}
                          {isToday && " •"}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 rounded-md bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${isToday ? "bg-primary" : "bg-primary/60"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right text-sm font-medium text-foreground">
                          ${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
                <CardDescription>Últimos registros de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground">No hay ventas registradas aún</p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/sales/new">Registrar tu primera venta</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentSales.map((sale) => (
                      <Link
                        key={sale.id}
                        href={`/sales/${sale.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {format(new Date(sale.sale_date + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                          {sale.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{sale.notes}</p>
                          )}
                        </div>
                        <div className="text-lg font-semibold text-foreground">
                          ${sale.total_revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
