import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { SalesEntryForm } from "@/components/sales/sales-entry-form"

async function getProducts() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, category")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })
  return products || []
}

export default async function NewSalePage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Registrar Ventas del Día</h1>
            <p className="text-muted-foreground">
              Ingresa la cantidad vendida de cada producto hoy
            </p>
          </div>
          <SalesEntryForm products={products} />
        </div>
      </main>
    </div>
  )
}
