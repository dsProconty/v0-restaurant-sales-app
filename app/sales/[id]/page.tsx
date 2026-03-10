import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar, Edit, FileText } from "lucide-react"
import { DeleteSaleButton } from "@/components/sales/delete-sale-button"

async function getSaleDetails(id: string) {
  const supabase = await createClient()

  const { data: sale, error } = await supabase
    .from("daily_sales")
    .select(`
      id,
      sale_date,
      total_revenue,
      notes,
      created_at,
      sales_items (
        id,
        quantity,
        unit_price,
        subtotal,
        products (
          id,
          name,
          category
        )
      )
    `)
    .eq("id", id)
    .maybeSingle()

  return { sale, error }
}

export default async function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sale, error } = await getSaleDetails(id)

  if (!sale) {
    notFound()
  }

  const itemCount = sale.sales_items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const itemsByCategory: Record<string, typeof sale.sales_items> = {}
  for (const item of sale.sales_items || []) {
    const category = item.products?.category || "Sin Categoría"
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = []
    }
    itemsByCategory[category].push(item)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/sales/history">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver al historial</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {format(new Date(sale.sale_date + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h1>
              <p className="text-muted-foreground">
                {itemCount} artículo{itemCount !== 1 ? "s" : ""} vendido{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/sales/new?date=${sale.sale_date}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <DeleteSaleButton saleId={sale.id} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Artículos Vendidos</CardTitle>
                  <CardDescription>Desglose de productos vendidos este día</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Precio Unitario</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-foreground">
                                {item.products?.name || "Producto Desconocido"}
                              </TableCell>
                              <TableCell className="text-right text-foreground">
                                ${item.unit_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-foreground">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right text-foreground">
                                ${item.subtotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}

                  <div className="border-t border-border mt-4 pt-4">
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>${sale.total_revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-medium text-foreground">
                      {format(new Date(sale.sale_date + "T12:00:00"), "d 'de' MMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Artículos Vendidos</span>
                    <span className="font-medium text-foreground">{itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos</span>
                    <span className="font-medium text-foreground">{sale.sales_items?.length || 0}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium text-foreground">Ingreso Total</span>
                      <span className="font-bold text-primary">
                        ${sale.total_revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {sale.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{sale.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
