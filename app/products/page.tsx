import { createClient } from "@/lib/supabase/server"
import { ProductList } from "@/components/products/product-list"
import { AddProductDialog } from "@/components/products/add-product-dialog"

async function getProducts() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })
  return products || []
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
              <p className="text-muted-foreground">
                Administra los artículos del menú y sus precios
              </p>
            </div>
            <AddProductDialog />
          </div>
          <ProductList products={products} />
        </div>
      </main>
    </div>
  )
}

