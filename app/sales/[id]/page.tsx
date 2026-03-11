import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Edit, FileText, Receipt, Tag, Hash, Layers } from "lucide-react"
import { DeleteSaleButton } from "@/components/sales/delete-sale-button"

async function getSaleDetails(id: string) {
  const supabase = await createClient()
  const { data: sale, error } = await supabase
    .from("daily_sales")
    .select(`
      id, sale_date, total_revenue, notes, created_at,
      sales_items (
        id, quantity, unit_price, subtotal,
        products ( id, name, category )
      )
    `)
    .eq("id", id)
    .maybeSingle()
  return { sale, error }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default async function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sale } = await getSaleDetails(id)
  if (!sale) notFound()

  const itemCount = sale.sales_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const itemsByCategory: Record<string, typeof sale.sales_items> = {}
  for (const item of sale.sales_items || []) {
    const category = item.products?.category ? capitalize(item.products.category) : "Sin Categoría"
    if (!itemsByCategory[category]) itemsByCategory[category] = []
    itemsByCategory[category].push(item)
  }

  const stats = [
    { label: "Productos", value: sale.sales_items?.length || 0, icon: Tag },
    { label: "Artículos", value: itemCount, icon: Hash },
    { label: "Categorías", value: Object.keys(itemsByCategory).length, icon: Layers },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border shrink-0" asChild>
            <Link href="/sales/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground capitalize truncate">
              {format(new Date(sale.sale_date + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {itemCount} artículo{itemCount !== 1 ? "s" : ""} en {Object.keys(itemsByCategory).length} categoría{Object.keys(itemsByCategory).length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs" asChild>
              <Link href={`/sales/new?date=${sale.sale_date}`}>
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Link>
            </Button>
            <DeleteSaleButton saleId={sale.id} />
          </div>
        </div>

        {/* ── Hero total ── */}
        <div className="rounded-2xl bg-primary px-6 py-5 mb-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-1">
              Ingreso Total
            </p>
            <p className="text-4xl font-bold text-primary-foreground tracking-tight">
              ${sale.total_revenue.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-foreground/15">
            <Receipt className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none">{label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Items by category ── */}
        <div className="space-y-3 mb-4">
          {Object.entries(itemsByCategory).map(([category, items]) => {
            const categoryTotal = items!.reduce((sum, item) => sum + item.subtotal, 0)
            const categoryQty = items!.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <div key={category} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{category}</span>
                    <span className="text-xs text-muted-foreground">{categoryQty} uds.</span>
                  </div>
                  <span className="text-sm font-bold text-primary">${categoryTotal.toFixed(2)}</span>
                </div>

                {/* Product rows */}
                <div className="divide-y divide-border">
                  {items!.map((item) => (
                    <div key={item.id} className="flex items-center px-5 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.products?.name || "Producto Desconocido"}
                        </p>
                        <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {item.quantity}
                        </div>
                        <span className="text-sm font-bold text-foreground w-16 text-right">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Total footer ── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-muted-foreground">Total del día</span>
          <span className="text-2xl font-bold text-primary">${sale.total_revenue.toFixed(2)}</span>
        </div>

        {/* ── Notes ── */}
        {sale.notes && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Notas</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{sale.notes}</p>
          </div>
        )}

      </main>
    </div>
  )
}
