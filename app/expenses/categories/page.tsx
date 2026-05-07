import { getExpenseCategories } from "@/app/expenses/actions"
import { CategoryManager } from "@/components/expenses/category-manager"

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories()

  return (
    <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Proveedores</h1>
        <p className="text-sm text-muted-foreground">Administra las categorías de tus gastos</p>
      </div>
      <CategoryManager initialCategories={categories} />
    </main>
  )
}
