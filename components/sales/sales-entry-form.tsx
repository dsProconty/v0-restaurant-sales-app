"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Package, Save, PencilLine, ChevronDown, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  price: number
  category: string | null
}

interface SalesEntryFormProps {
  products: Product[]
  initialDate?: string
  initialEntries?: Record<string, number>
  initialNotes?: string
  isEditing?: boolean
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function SalesEntryForm({
  products,
  initialDate,
  initialEntries = {},
  initialNotes = "",
  isEditing = false,
}: SalesEntryFormProps) {
  const router = useRouter()

  const parseInitialDate = () => {
    if (initialDate) {
      try { return parseISO(initialDate + "T12:00:00") } catch { return new Date() }
    }
    return new Date()
  }

  const [date, setDate] = useState<Date>(parseInitialDate())
  const [entries, setEntries] = useState<Record<string, number>>(initialEntries)
  const [notes, setNotes] = useState(initialNotes)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const supabase = createClient()

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {}
    for (const product of products) {
      const category = capitalize(product.category || "Sin Categoría")
      if (!groups[category]) groups[category] = []
      groups[category].push(product)
    }
    return groups
  }, [products])

  const categories = Object.keys(groupedProducts)

  const totalAmount = useMemo(() =>
    Object.entries(entries).reduce((sum, [productId, quantity]) => {
      const product = products.find((p) => p.id === productId)
      return sum + (product ? product.price * quantity : 0)
    }, 0), [entries, products])

  const itemCount = useMemo(() =>
    Object.values(entries).reduce((sum, qty) => sum + qty, 0), [entries])

  const selectedItems = useMemo(() =>
    Object.entries(entries)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({
        product: products.find((p) => p.id === productId)!,
        quantity,
      }))
      .filter(({ product }) => product), [entries, products])

  function handleIncrement(productId: string) {
    setEntries((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  function handleDecrement(productId: string) {
    setEntries((prev) => {
      const current = prev[productId] || 0
      if (current <= 0) return prev
      return { ...prev, [productId]: current - 1 }
    })
  }

  function handleInputChange(productId: string, value: string) {
    const num = parseInt(value)
    if (value === "" || isNaN(num) || num < 0) {
      setEntries((prev) => ({ ...prev, [productId]: 0 }))
    } else {
      setEntries((prev) => ({ ...prev, [productId]: num }))
    }
  }

  function toggleCategory(category: string) {
    setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function scrollToCategory(category: string) {
    categoryRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const setCategoryRef = useCallback((category: string) => (el: HTMLDivElement | null) => {
    categoryRefs.current[category] = el
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totalAmount === 0 && notes.trim() === "") {
      toast.error("Ingresa al menos un producto o una nota antes de guardar.")
      return
    }
    setIsSubmitting(true)
    try {
      const saleDate = format(date, "yyyy-MM-dd")
      const { data: existingSale } = await supabase
        .from("daily_sales").select("id").eq("sale_date", saleDate).maybeSingle()

      let saleId: string
      if (existingSale) {
        const { error } = await supabase.from("daily_sales")
          .update({ total_revenue: totalAmount, notes: notes.trim() || null })
          .eq("id", existingSale.id)
        if (error) throw error
        await supabase.from("sales_items").delete().eq("daily_sale_id", existingSale.id)
        saleId = existingSale.id
      } else {
        const { data: newSale, error } = await supabase.from("daily_sales")
          .insert({ sale_date: saleDate, total_revenue: totalAmount, notes: notes.trim() || null })
          .select("id").maybeSingle()
        if (error) throw error
        saleId = newSale!.id
      }

      const items = Object.entries(entries)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = products.find((p) => p.id === productId)!
          return { daily_sale_id: saleId, product_id: productId, quantity, unit_price: product.price, subtotal: product.price * quantity }
        })

      if (items.length > 0) {
        const { error } = await supabase.from("sales_items").insert(items)
        if (error) throw error
      }

      toast.success(isEditing ? "¡Venta actualizada!" : "¡Ventas guardadas correctamente!")
      router.push(`/sales/${saleId}`)
    } catch (error) {
      console.error("Error guardando ventas:", error)
      toast.error("Error al guardar las ventas. Intenta de nuevo.")
      setIsSubmitting(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Sin productos disponibles</h3>
        <p className="text-sm text-muted-foreground mb-4">Agrega productos antes de registrar ventas</p>
        <Button onClick={() => router.push("/products")}>Agregar Productos</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">

      {/* ── Banner edición ── */}
      {isEditing && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 mb-6">
          <PencilLine className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold text-blue-800">Modo edición — </span>
            Cantidades anteriores precargadas. Puedes modificarlas o agregar más productos.
          </p>
        </div>
      )}

      {/* ── Date picker ── */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Fecha de venta
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isEditing}
              className={cn(
                "w-full sm:w-auto justify-start text-left font-medium h-11 rounded-xl px-4 gap-2",
                isEditing && "opacity-60 cursor-not-allowed"
              )}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Selecciona una fecha"}
              {isEditing && <Badge variant="secondary" className="ml-auto text-xs">Fijo</Badge>}
            </Button>
          </PopoverTrigger>
          {!isEditing && (
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus locale={es} />
            </PopoverContent>
          )}
        </Popover>
      </div>

      {/* ── Sticky category tabs ── */}
      <div className="sticky top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-background/95 backdrop-blur-sm border-b border-border pb-3 pt-2 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const catTotal = groupedProducts[cat].reduce((s, p) => s + (entries[p.id] || 0), 0)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => scrollToCategory(cat)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
                  catTotal > 0
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat}
                {catTotal > 0 && (
                  <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary-foreground/20 text-xs font-bold">
                    {catTotal}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">

          {/* ── Product categories ── */}
          {categories.map((category) => {
            const categoryProducts = groupedProducts[category]
            const isCollapsed = collapsedCategories[category]
            const catCount = categoryProducts.reduce((s, p) => s + (entries[p.id] || 0), 0)

            return (
              <div
                key={category}
                ref={setCategoryRef(category)}
                className="rounded-2xl border border-border bg-card overflow-hidden scroll-mt-24"
              >
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-foreground">{category}</span>
                    <span className="text-xs text-muted-foreground">{categoryProducts.length} productos</span>
                    {catCount > 0 && (
                      <Badge className="text-xs py-0 h-5 bg-primary/10 text-primary border-primary/20">
                        {catCount} sel.
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )} />
                </button>

                {/* Products grid */}
                {!isCollapsed && (
                  <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryProducts.map((product) => {
                      const qty = entries[product.id] || 0
                      const originalQty = initialEntries[product.id] || 0
                      const changed = isEditing && qty !== originalQty

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "relative rounded-xl border p-3 transition-all duration-150",
                            qty > 0
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm"
                              : "border-border bg-background hover:border-border/80"
                          )}
                        >
                          {/* Selected indicator */}
                          {qty > 0 && (
                            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-emerald-500" />
                          )}

                          <div className="mb-2.5">
                            <p className="text-sm font-semibold text-foreground leading-tight pr-4">{product.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">${product.price.toFixed(2)} c/u</p>
                            {changed && (
                              <Badge variant="outline" className={cn(
                                "text-xs py-0 h-4 mt-1",
                                qty > originalQty ? "border-green-300 text-green-700" : "border-orange-300 text-orange-600"
                              )}>
                                {qty > originalQty ? `+${qty - originalQty}` : `${qty - originalQty}`}
                              </Badge>
                            )}
                          </div>

                          {/* +/- controls with editable input */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDecrement(product.id)}
                              disabled={qty === 0}
                              className={cn(
                                "flex items-center justify-center h-9 w-9 rounded-lg border font-bold transition-all shrink-0 text-lg",
                                qty === 0
                                  ? "border-border text-muted-foreground/30 cursor-not-allowed bg-muted/30"
                                  : "border-border bg-white text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95"
                              )}
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={qty === 0 ? "" : qty}
                              onChange={(e) => handleInputChange(product.id, e.target.value)}
                              placeholder="0"
                              className={cn(
                                "flex-1 h-9 rounded-lg border text-center text-sm font-bold bg-background transition-colors outline-none",
                                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                qty > 0
                                  ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                                  : "border-border text-foreground focus:border-primary"
                              )}
                            />

                            <button
                              type="button"
                              onClick={() => handleIncrement(product.id)}
                              className="flex items-center justify-center h-9 w-9 rounded-lg border font-bold transition-all shrink-0 text-lg border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                            >
                              +
                            </button>
                          </div>

                          {qty > 0 && (
                            <p className="text-xs font-semibold text-emerald-600 mt-2 text-right">
                              = ${(product.price * qty).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Notes ── */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="text-sm font-semibold text-foreground mb-1 block">Notas del día</label>
            <p className="text-xs text-muted-foreground mb-3">Eventos especiales, clima, promociones...</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Día lluvioso, menos clientes de lo usual..."
              rows={3}
              className="resize-none rounded-xl text-sm"
            />
          </div>
        </div>

        {/* ── Sticky summary sidebar ── */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-primary-foreground/80 text-xs font-semibold uppercase tracking-wider">
                  {isEditing ? "Resumen actualizado" : "Resumen"}
                </p>
                <ShoppingCart className="h-4 w-4 text-primary-foreground/60" />
              </div>
              <p className="text-3xl font-bold text-primary-foreground">${totalAmount.toFixed(2)}</p>
              <p className="text-primary-foreground/70 text-xs mt-0.5">{itemCount} artículo{itemCount !== 1 ? "s" : ""}</p>
            </div>

            {/* Items list */}
            <div className="px-5 py-4 max-h-72 overflow-y-auto">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Agrega productos con +
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(({ product, quantity }) => {
                    const originalQty = initialEntries[product.id] || 0
                    const changed = isEditing && quantity !== originalQty
                    return (
                      <div key={product.id} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">×{quantity}
                            {changed && (
                              <span className={cn("ml-1 font-semibold", quantity > originalQty ? "text-green-600" : "text-orange-500")}>
                                ({quantity > originalQty ? "+" : ""}{quantity - originalQty})
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-foreground shrink-0">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Divider + total */}
            {selectedItems.length > 0 && (
              <div className="mx-5 border-t border-border pt-3 pb-1 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-primary">${totalAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Save button */}
            <div className="p-5 pt-3">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold"
                disabled={isSubmitting || (totalAmount === 0 && notes.trim() === "")}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Ventas" : "Guardar Ventas"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating bottom bar ── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{itemCount} artículo{itemCount !== 1 ? "s" : ""}</p>
            <p className="text-xl font-bold text-foreground">${totalAmount.toFixed(2)}</p>
          </div>
          <Button
            type="submit"
            className="h-12 px-6 rounded-xl font-semibold shrink-0"
            disabled={isSubmitting || (totalAmount === 0 && notes.trim() === "")}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Spacer for mobile floating bar */}
      <div className="h-24 lg:hidden" />
    </form>
  )
}
