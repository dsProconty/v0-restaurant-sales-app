import { getExpenses, getExpenseCategories, getSuppliers } from "./actions"
import { ExpenseList } from "@/components/expenses/expense-list"
import { NewExpenseDialog } from "@/components/expenses/new-expense-dialog"

export default async function ExpensesPage() {
  const [expenses, categories, suppliers] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getSuppliers(),
  ])

  const totalMonth = expenses
    .filter((e) => {
      const now = new Date()
      const d = new Date(e.date + "T12:00:00")
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalToday = expenses
    .filter((e) => {
      const today = new Date().toISOString().slice(0, 10)
      return e.date === today
    })
    .reduce((sum, e) => sum + Number(e.amount), 0)

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Gastos hoy</p>
          <p className="text-2xl font-bold text-foreground">
            ${totalToday.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Gastos este mes</p>
          <p className="text-2xl font-bold text-primary">
            ${totalMonth.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* List */}
      <ExpenseList expenses={expenses} categories={categories} />
    </main>
  )
}
