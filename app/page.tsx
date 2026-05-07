import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  PlusCircle,
  TrendingUp,
  Package,
  CheckCircle2,
  Receipt,
  Truck,
  BarChart3,
  ArrowRight,
  DollarSign,
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { getReminders } from "@/app/reminders/actions"
import { getExpenses, getSuppliers } from "@/app/expenses/actions"
import { RemindersWidget } from "@/components/reminders/reminders-widget"

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")

  const [
    { data: todaySale },
    { data: recentSales },
    { count: productCount },
  ] = await Promise.all([
    supabase
      .from("daily_sales")
      .select("id, total_revenue")
      .eq("sale_date", todayStr)
      .maybeSingle(),
    supabase
      .from("daily_sales")
      .select("id, sale_date, total_revenue, notes")
      .order("sale_date", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ])

  return {
    todayTotal: todaySale?.total_revenue || 0,
    todayRegistered: !!todaySale,
    todaySaleId: todaySale?.id || null,
    productCount: productCount || 0,
    recentSales: recentSales || [],
  }
}

export default async function DashboardPage() {
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")

  const [data, reminders, expenses, suppliers] = await Promise.all([
    getDashboardData(),
    getReminders().catch(() => []),
    getExpenses().catch(() => []),
    getSuppliers().catch(() => []),
  ])

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const urgentReminders = reminders.filter(
    (r) => r.status === "overdue" || r.status === "today"
  ).length

  const greeting = (() => {
    const h = today.getHours()
    if (h < 12) return "Buenos días"
    if (h < 18) return "Buenas tardes"
    return "Buenas noches"
  })()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 pb-8">

      {/* Welcome */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(today, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        {data.todayRegistered ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ventas de hoy registradas</span>
            <Link href={`/sales/${data.todaySaleId}`} className="underline font-medium ml-1">
              Ver
            </Link>
          </div>
        ) : (
          <Button asChild className="rounded-xl h-9">
            <Link href="/sales/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Registrar ventas de hoy
            </Link>
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Ventas del día</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${data.todayTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            {data.todayRegistered && (
              <Badge variant="secondary" className="mt-2 text-[10px] bg-green-100 text-green-700">
                ✓ Registrado
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Gastos del día</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <Receipt className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${todayExpenses.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {expenses.filter((e) => e.date === todayStr).length} registro(s) hoy
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Productos activos</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.productCount}</p>
            <Link href="/products" className="text-[11px] text-primary hover:underline mt-2 block">
              Ver productos
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Proveedores</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Truck className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{suppliers.length}</p>
            <Link href="/expenses/suppliers" className="text-[11px] text-primary hover:underline mt-2 block">
              Ver proveedores
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Catálogos quick access */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/products"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Productos</p>
                <p className="text-xs text-muted-foreground">{data.productCount} activos</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          <Link
            href="/expenses/suppliers"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <Truck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Proveedores</p>
                <p className="text-xs text-muted-foreground">{suppliers.length} registrados</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          <Link
            href="/reports"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Reportes</p>
                <p className="text-xs text-muted-foreground">Ver análisis</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>

      {/* Bottom grid: Recent sales + Reminders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent sales */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Ventas recientes</CardTitle>
            <Link href="/sales/history" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todo <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No hay ventas registradas</p>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/sales/new">Registrar primera venta</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/sales/${sale.id}`}
                    className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground capitalize truncate">
                        {format(new Date(sale.sale_date + "T12:00:00"), "EEE d 'de' MMM", { locale: es })}
                      </p>
                      {sale.notes && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-36">{sale.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        ${sale.total_revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders widget */}
        <RemindersWidget reminders={reminders} />
      </div>
    </div>
  )
}
