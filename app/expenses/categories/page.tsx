import { getExpenseCategories } from "@/app/expenses/actions"
import { CategoryManager } from "@/components/expenses/category-manager"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories()

  return (
    <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Categorías de gastos</h1>
          <p className="text-sm text-muted-foreground">Crea y administra tus propias categorías</p>
        </div>
      </div>

      <CategoryManager initialCategories={categories} />
    </main>
  )
}
