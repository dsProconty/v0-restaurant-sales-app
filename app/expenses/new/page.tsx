import { getExpenseCategories } from "@/app/expenses/actions"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { Navigation } from "@/components/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewExpensePage() {
  const categories = await getExpenseCategories()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuevo gasto</h1>
          <p className="text-sm text-muted-foreground">Registra un gasto del restaurante</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <ExpenseForm categories={categories} />
      </div>
    </main>
    </div>
  )
}
