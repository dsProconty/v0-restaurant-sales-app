import { getExpenses, getExpenseCategories, getSuppliers } from "./actions"
import { ExpenseList } from "@/components/expenses/expense-list"
import { NewExpenseDialog } from "@/components/expenses/new-expense-dialog"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export default async function ExpensesPage() {
  const [expenses, categories, suppliers] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getSuppliers(),
  ])

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().slice(0, 10)
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString().slice(0, 10)
  const monthStart = startOfMonth(now).toISOString().slice(0, 10)
  const monthEnd = endOfMonth(now).toISOString().slice(0, 10)

  const totalToday = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalWeek = expenses
    .filter((e) => e.date >= weekStart && e.date <= weekEnd)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalMonth = expenses
    .filter((e) => e.date >= monthStart && e.date <= monthEnd)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground">Registro de gastos diarios del restaurante</p>
        </div>
        <NewExpenseDialog categories={categories} suppliers={suppliers} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Hoy</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalToday)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Esta semana</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalWeek)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Este mes</p>
          <p className="text-xl font-bold text-primary">{fmt(totalMonth)}</p>
        </div>
      </div>

      {/* List */}
      <ExpenseList expenses={expenses} categories={categories} suppliers={suppliers} />
    </main>
  )
}
