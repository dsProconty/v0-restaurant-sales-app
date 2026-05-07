import { getExpenseCategories } from "@/app/expenses/actions"
import { CategoryManager } from "@/components/expenses/category-manager"
import { Navigation } from "@/components/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ExpenseCategoriesPage() {
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
          <h1 className="text-xl font-bold text-foreground">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Administra las categorías de tus gastos</p>
        </div>
      </div>

      <CategoryManager initialCategories={categories} />
    </main>
    </div>
  )
}
