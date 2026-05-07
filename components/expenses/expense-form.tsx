"use client"

import { useState, useTransition } from "react"
import { createExpense } from "@/app/expenses/actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  color: string
}

export function ExpenseForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [date, setDate] = useState<Date>(new Date())
  const [calOpen, setCalOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [amountWithoutTax, setAmountWithoutTax] = useState("")
  const [supplier, setSupplier] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")

  // Auto-calculate tax when amount and amount_without_tax are filled
  const taxAmount =
    amount && amountWithoutTax && !isNaN(parseFloat(amount)) && !isNaN(parseFloat(amountWithoutTax))
      ? (parseFloat(amount) - parseFloat(amountWithoutTax)).toFixed(2)
      : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("date", format(date, "yyyy-MM-dd"))
    if (categoryId) formData.set("category_id", categoryId)
    if (supplier.trim()) formData.set("supplier", supplier.trim())
    if (description.trim()) formData.set("description", description.trim())
    formData.set("amount", amount)
    if (amountWithoutTax.trim()) formData.set("amount_without_tax", amountWithoutTax)
    if (notes.trim()) formData.set("notes", notes.trim())

    console.log("[ExpenseForm] Submitting expense for date:", format(date, "yyyy-MM-dd"))

    startTransition(async () => {
      const result = await createExpense(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto registrado")
        router.push("/expenses")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Fecha */}
      <div className="space-y-1.5">
        <Label>Fecha *</Label>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "d 'de' MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { if (d) { setDate(d); setCalOpen(false) } }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Categoría */}
      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Sin categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin categoría</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Proveedor */}
      <div className="space-y-1.5">
        <Label>Proveedor</Label>
        <Input
          placeholder="ej: Distribuidora Central"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Input
          placeholder="ej: Compra de pollo y verduras"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Montos */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Monto total *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              className="pl-7"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Monto sin IVA <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              className="pl-7"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amountWithoutTax}
              onChange={(e) => setAmountWithoutTax(e.target.value)}
            />
          </div>
        </div>

        {taxAmount !== null && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            IVA calculado: <span className="font-semibold text-foreground">${taxAmount}</span>
          </p>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
        <Textarea
          placeholder="Cualquier observación adicional..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Guardando..." : "Guardar gasto"}
        </Button>
      </div>
    </form>
  )
}
