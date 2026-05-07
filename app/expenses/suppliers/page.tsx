import { getSuppliers } from "@/app/expenses/actions"
import { SuppliersList } from "@/components/expenses/suppliers-list"
import { AddSupplierDialog } from "@/components/expenses/add-supplier-dialog"

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Proveedores</h1>
            <p className="text-muted-foreground">
              Administra los proveedores de tu restaurante
            </p>
          </div>
          <AddSupplierDialog />
        </div>
        <SuppliersList suppliers={suppliers} />
      </div>
    </main>
  )
}
