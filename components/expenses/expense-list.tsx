"use client"

import { useState, useTransition } from "react"
import { deleteExpense } from "@/app/expenses/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Receipt } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface Category {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  date: string
  supplier: string | null
  description: string | null
  amount: number
  amount_without_tax: number | null
  tax_amount: number | null
  notes: string | null
  category_id: string | null
  expense_categories: Category | null
}

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
}

export function ExpenseList({ expenses, categories }: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isPending, startTransition] = useTransition()

  const filtered = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category_id === filterCategory)

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return
    startTransition(async () => {
      console.log("[ExpenseList] Deleting expense:", id)
      const result = await deleteExpense(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto eliminado")
      }
    })
  }

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
            {/* Color dot */}
            <div
              className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: expense.expense_categories?.color ?? "#94a3b8" }}
            />

            {/* Info */}
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
              {expense.amount_without_tax != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sin IVA: ${Number(expense.amount_without_tax).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  {" · "}
                  IVA: ${Number(expense.tax_amount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              )}
              {expense.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">{expense.notes}</p>
              )}
            </div>

            {/* Amount + delete */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-base font-bold text-foreground">
                ${Number(expense.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
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
  )
}
