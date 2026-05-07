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

interface Supplier {
  id: string
  name: string
}

export function ExpenseForm({
  categories,
  suppliers,
  onSuccess,
}: {
  categories: Category[]
  suppliers: Supplier[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [date, setDate] = useState<Date>(new Date())
  const [calOpen, setCalOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string>("none")
  const [supplierId, setSupplierId] = useState<string>("none")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("date", format(date, "yyyy-MM-dd"))
    if (categoryId && categoryId !== "none") formData.set("category_id", categoryId)
    if (supplierId && supplierId !== "none") {
      const s = suppliers.find((s) => s.id === supplierId)
      if (s) formData.set("supplier", s.name)
    }
    if (description.trim()) formData.set("description", description.trim())
    formData.set("amount", amount)
    if (notes.trim()) formData.set("notes", notes.trim())

    startTransition(async () => {
      const result = await createExpense(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto registrado")
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/expenses")
        }
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
            <SelectItem value="none">Sin categoría</SelectItem>
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
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger>
            <SelectValue placeholder="Sin proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin proveedor</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Monto */}
      <div className="space-y-1.5">
        <Label>Monto total factura *</Label>
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
