import { getExpenseCategories } from "@/app/expenses/actions"
import { CategoriesList } from "@/components/expenses/categories-list"
import { AddCategoryDialog } from "@/components/expenses/add-category-dialog"

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorías de Gastos</h1>
            <p className="text-muted-foreground">
              Organiza tus gastos en categorías personalizadas
            </p>
          </div>
          <AddCategoryDialog />
        </div>
        <CategoriesList categories={categories} />
      </div>
    </main>
  )
}
