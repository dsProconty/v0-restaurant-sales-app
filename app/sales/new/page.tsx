import { createClient } from "@/lib/supabase/server"
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

async function getExistingSale(date: string) {
  const supabase = await createClient()
  const { data: sale } = await supabase
    .from("daily_sales")
    .select(`
      id,
      sale_date,
      notes,
      sales_items (
        product_id,
        quantity
      )
    `)
    .eq("sale_date", date)
    .maybeSingle()
  return sale || null
}

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const products = await getProducts()

  // Si viene con ?date= buscamos si ya existe venta ese día
  const existingSale = date ? await getExistingSale(date) : null

  // Construir mapa de quantities precargadas
  const initialEntries: Record<string, number> = {}
  if (existingSale?.sales_items) {
    for (const item of existingSale.sales_items) {
      initialEntries[item.product_id] = item.quantity
    }
  }

  const isEditing = !!existingSale

  return (
    <div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? "Editar Ventas del Día" : "Registrar Ventas del Día"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Las cantidades anteriores están precargadas. Puedes modificarlas o agregar más productos."
                : "Ingresa la cantidad vendida de cada producto hoy"}
            </p>
          </div>
          <SalesEntryForm
            products={products}
            initialDate={date}
            initialEntries={initialEntries}
            initialNotes={existingSale?.notes || ""}
            isEditing={isEditing}
          />
        </div>
      </main>
    </div>
  )
}
