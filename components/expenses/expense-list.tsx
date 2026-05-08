"use client"

import { useState, useTransition } from "react"
import { updateExpense, deleteExpense } from "@/app/expenses/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Receipt, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string
}

interface Supplier {
  id: string
  name: string
}

interface Expense {
  id: string
  date: string
  supplier: string | null
  description: string | null
  amount: number
  notes: string | null
  category_id: string | null
  source: string | null
  expense_categories: Category | null
}

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  suppliers: Supplier[]
}

export function ExpenseList({ expenses, categories, suppliers }: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [editing, setEditing] = useState<Expense | null>(null)
  const [isPending, startTransition] = useTransition()

  // Edit form state
  const [editDate, setEditDate] = useState<Date>(new Date())
  const [editCalOpen, setEditCalOpen] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState("none")
  const [editSupplierId, setEditSupplierId] = useState("none")
  const [editAmount, setEditAmount] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editNotes, setEditNotes] = useState("")

  function startEdit(expense: Expense) {
    setEditing(expense)
    setEditDate(parseISO(expense.date + "T12:00:00"))
    setEditCategoryId(expense.category_id ?? "none")
    const matchedSupplier = suppliers.find((s) => s.name === expense.supplier)
    setEditSupplierId(matchedSupplier?.id ?? "none")
    setEditAmount(String(expense.amount))
    setEditDescription(expense.description ?? "")
    setEditNotes(expense.notes ?? "")
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return

    const formData = new FormData()
    formData.set("date", format(editDate, "yyyy-MM-dd"))
    if (editCategoryId !== "none") formData.set("category_id", editCategoryId)
    if (editSupplierId !== "none") {
      const s = suppliers.find((s) => s.id === editSupplierId)
      if (s) formData.set("supplier", s.name)
    }
    if (editDescription.trim()) formData.set("description", editDescription.trim())
    formData.set("amount", editAmount)
    if (editNotes.trim()) formData.set("notes", editNotes.trim())

    startTransition(async () => {
      const result = await updateExpense(editing.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto actualizado")
        setEditing(null)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return
    startTransition(async () => {
      const result = await deleteExpense(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto eliminado")
      }
    })
  }

  const filtered = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category_id === filterCategory)

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Sin gastos registrados</p>
        <p className="text-xs text-muted-foreground mt-1">Agrega tu primer gasto con el botón de arriba</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filtrar por:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} gasto{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {filtered.map((expense) => (
            <div
              key={expense.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: expense.expense_categories?.color ?? "#94a3b8" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {expense.expense_categories && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                      style={{ borderColor: expense.expense_categories.color, color: expense.expense_categories.color }}
                    >
                      {expense.expense_categories.name}
                    </Badge>
                  )}
                  {expense.source === "whatsapp" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                      📱 WhatsApp
                    </Badge>
                  )}
                  {expense.supplier && (
                    <span className="text-sm font-medium text-foreground truncate">{expense.supplier}</span>
                  )}
                  {expense.description && (
                    <span className="text-xs text-muted-foreground truncate">{expense.description}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(parseISO(expense.date + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                {expense.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{expense.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-base font-bold text-foreground mr-2">
                  ${Number(expense.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => startEdit(expense)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(expense.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Fecha */}
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Popover open={editCalOpen} onOpenChange={setEditCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editDate, "d 'de' MMMM yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={(d) => { if (d) { setEditDate(d); setEditCalOpen(false) } }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
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
                <Select value={editSupplierId} onValueChange={setEditSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input
                  placeholder="ej: Compra de pollo y verduras"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
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
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea
                  placeholder="Cualquier observación adicional..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
