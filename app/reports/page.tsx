import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from "lucide-react"

async function getReportData() {
  const supabase = await createClient()
  const today = new Date()
  
  // Current month
  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  
  // Previous month
  const prevMonthStart = startOfMonth(subMonths(today, 1))
  const prevMonthEnd = endOfMonth(subMonths(today, 1))
  
  // Current week
  const currentWeekStart = startOfWeek(today)
  const currentWeekEnd = endOfWeek(today)
  
  // Get current month sales
  const { data: currentMonthSales } = await supabase
    .from("daily_sales")
    .select("total_amount, sale_date")
    .gte("sale_date", format(currentMonthStart, "yyyy-MM-dd"))
    .lte("sale_date", format(currentMonthEnd, "yyyy-MM-dd"))
  
  // Get previous month sales
  const { data: prevMonthSales } = await supabase
    .from("daily_sales")
    .select("total_amount")
    .gte("sale_date", format(prevMonthStart, "yyyy-MM-dd"))
    .lte("sale_date", format(prevMonthEnd, "yyyy-MM-dd"))
  
  // Get current week sales
  const { data: currentWeekSales } = await supabase
    .from("daily_sales")
    .select("total_amount")
    .gte("sale_date", format(currentWeekStart, "yyyy-MM-dd"))
    .lte("sale_date", format(currentWeekEnd, "yyyy-MM-dd"))
  
  // Get top products this month
  const { data: topProducts } = await supabase
    .from("sales_items")
    .select(`
      quantity,
      subtotal,
      products (
        name,
        category
      ),
      daily_sales!inner (
        sale_date
      )
    `)
    .gte("daily_sales.sale_date", format(currentMonthStart, "yyyy-MM-dd"))
    .lte("daily_sales.sale_date", format(currentMonthEnd, "yyyy-MM-dd"))
  
  // Aggregate top products
  const productStats: Record<string, { name: string; category: string | null; quantity: number; revenue: number }> = {}
  for (const item of topProducts || []) {
    const name = item.products?.name || "Desconocido"
    if (!productStats[name]) {
      productStats[name] = {
        name,
        category: item.products?.category || null,
        quantity: 0,
        revenue: 0,
      }
    }
    productStats[name].quantity += item.quantity
    productStats[name].revenue += item.subtotal
  }
  
  const sortedProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
  
  // Calculate totals
  const currentMonthTotal = currentMonthSales?.reduce((sum, s) => sum + s.total_amount, 0) || 0
  const prevMonthTotal = prevMonthSales?.reduce((sum, s) => sum + s.total_amount, 0) || 0
  const currentWeekTotal = currentWeekSales?.reduce((sum, s) => sum + s.total_amount, 0) || 0
  
  const monthOverMonthChange = prevMonthTotal > 0 
    ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
    : 0
  
  const daysRecorded = currentMonthSales?.length || 0
  const avgDailySales = daysRecorded > 0 ? currentMonthTotal / daysRecorded : 0
  
  // Daily breakdown for current month
  const dailyBreakdown = currentMonthSales?.map(s => ({
    date: s.sale_date,
    amount: s.total_amount,
  })).sort((a, b) => a.date.localeCompare(b.date)) || []
  
  // Best and worst days
  const bestDay = dailyBreakdown.length > 0 
    ? dailyBreakdown.reduce((best, day) => day.amount > best.amount ? day : best)
    : null
  const worstDay = dailyBreakdown.length > 0 
    ? dailyBreakdown.reduce((worst, day) => day.amount < worst.amount ? day : worst)
    : null
  
  return {
    currentMonthTotal,
    prevMonthTotal,
    currentWeekTotal,
    monthOverMonthChange,
    daysRecorded,
    avgDailySales,
    topProducts: sortedProducts,
    bestDay,
    worstDay,
    dailyBreakdown,
  }
}

export default async function ReportsPage() {
  const data = await getReportData()
  const today = new Date()
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h1>
            <p className="text-muted-foreground">
              Análisis de ventas e información de rendimiento
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.currentMonthTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {data.monthOverMonthChange >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{data.monthOverMonthChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{data.monthOverMonthChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.currentWeekTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(startOfWeek(today), "d 'de' MMM", { locale: es })} - {format(endOfWeek(today), "d 'de' MMM", { locale: es })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Diario</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.avgDailySales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Basado en {data.daysRecorded} días registrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mes Anterior</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${data.prevMonthTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(subMonths(today, 1), "MMMM yyyy", { locale: es })}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos Este Mes</CardTitle>
                <CardDescription>Mejores artículos por ingresos</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos de ventas para este mes aún
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.topProducts.map((product, index) => {
                      const maxRevenue = data.topProducts[0]?.revenue || 1
                      const percentage = (product.revenue / maxRevenue) * 100
                      return (
                        <div key={product.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.quantity} vendidos
                                  {product.category && ` • ${product.category}`}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-foreground">
                              ${product.revenue.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Destacados del Rendimiento</CardTitle>
                <CardDescription>Información clave de {format(today, "MMMM yyyy", { locale: es })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.bestDay && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-foreground">Mejor Día</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ${data.bestDay.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(data.bestDay.date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                )}
                
                {data.worstDay && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Día Más Lento</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ${data.worstDay.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(data.worstDay.date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                )}
                
                {!data.bestDay && !data.worstDay && (
                  <p className="text-center text-muted-foreground py-8">
                    Registra algunas ventas para ver los destacados de rendimiento
                  </p>
                )}
                
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium text-foreground mb-2">Estadísticas Rápidas</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Días Registrados</dt>
                      <dd className="font-medium text-foreground">{data.daysRecorded}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Productos Rastreados</dt>
                      <dd className="font-medium text-foreground">{data.topProducts.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Progreso del Mes</dt>
                      <dd className="font-medium text-foreground">
                        {Math.round((today.getDate() / endOfMonth(today).getDate()) * 100)}%
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {data.dailyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ventas Diarias - {format(today, "MMMM yyyy", { locale: es })}</CardTitle>
                <CardDescription>Desglose de ingresos por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.dailyBreakdown.map((day) => {
                    const maxAmount = Math.max(...data.dailyBreakdown.map(d => d.amount))
                    const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted-foreground">
                          {format(new Date(day.date + "T12:00:00"), "d 'de' MMM", { locale: es })}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 rounded-md bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right text-sm font-medium text-foreground">
                          ${day.amount.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
