"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Package, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  category: string | null
}

interface SalesEntry {
  productId: string
  quantity: number
}

export function SalesEntryForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [date, setDate] = useState<Date>(new Date())
  const [entries, setEntries] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {}
    for (const product of products) {
      const category = product.category || "Sin Categoría"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(product)
    }
    return groups
  }, [products])

  const totalAmount = useMemo(() => {
    return Object.entries(entries).reduce((sum, [productId, quantity]) => {
      const product = products.find((p) => p.id === productId)
      return sum + (product ? product.price * quantity : 0)
    }, 0)
  }, [entries, products])

  const itemCount = useMemo(() => {
    return Object.values(entries).reduce((sum, qty) => sum + qty, 0)
  }, [entries])

  function handleQuantityChange(productId: string, value: string) {
    const quantity = parseInt(value) || 0
    setEntries((prev) => ({
      ...prev,
      [productId]: quantity,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totalAmount === 0) return

    setIsSubmitting(true)

    const saleDate = format(date, "yyyy-MM-dd")

    // FIX #1: usar maybeSingle() en lugar de single()
    // single() lanza error 406 cuando no encuentra resultados
    // maybeSingle() devuelve null sin error
    const { data: existingSale } = await supabase
      .from("daily_sales")
      .select("id")
      .eq("sale_date", saleDate)
      .maybeSingle()

    let saleId: string

    if (existingSale) {
      // Update existing sale
      // FIX #2: columna correcta es "total_revenue", no "total_amount"
      await supabase
        .from("daily_sales")
        .update({
          total_revenue: totalAmount,
        })
        .eq("id", existingSale.id)

      // Delete existing items
      await supabase.from("sales_items").delete().eq("daily_sale_id", existingSale.id)

      saleId = existingSale.id
    } else {
      // Create new sale
      // FIX #2: columna correcta es "total_revenue", no "total_amount"
      const { data: newSale } = await supabase
        .from("daily_sales")
        .insert({
          sale_date: saleDate,
          total_revenue: totalAmount,
        })
        .select("id")
        .maybeSingle()

      saleId = newSale!.id
    }

    // Insert sale items
    const items = Object.entries(entries)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId)!
        return {
          daily_sale_id: saleId,
          product_id: productId,
          quantity,
          unit_price: product.price,
          subtotal: product.price * quantity,
        }
      })

    if (items.length > 0) {
      await supabase.from("sales_items").insert(items)
    }

    setIsSubmitting(false)
    router.push(`/sales/${saleId}`)
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay productos disponibles</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Agrega productos primero antes de registrar ventas
          </p>
          <Button className="mt-4" onClick={() => router.push("/products")}>
            Agregar Productos
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fecha de Venta</CardTitle>
              <CardDescription>Selecciona la fecha para este registro de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category}
                  <Badge variant="secondary">{categoryProducts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${product.id}`} className="sr-only">
                          Cantidad
                        </Label>
                        <Input
                          id={`qty-${product.id}`}
                          type="number"
                          min="0"
                          value={entries[product.id] || ""}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Notas (opcional)</CardTitle>
              <CardDescription>Agrega cualquier nota sobre las ventas de este día</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Evento especial, condiciones climáticas, promociones..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>{format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Object.entries(entries)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([productId, quantity]) => {
                    const product = products.find((p) => p.id === productId)!
                    return (
                      <div key={productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {product.name} x {quantity}
                        </span>
                        <span className="text-foreground">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
              </div>
              {itemCount > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total de Artículos</span>
                    <span>{itemCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground mt-2">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {itemCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingresa cantidades para ver el resumen
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || totalAmount === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : "Guardar Ventas"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  )
}
