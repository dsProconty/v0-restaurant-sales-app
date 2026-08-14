import { getCxcClients, getActiveProducts } from "@/app/cxc/actions"
import { DebtForm } from "@/components/cxc/debt-form"

export default async function NewCxcDebtPage() {
  const [clients, products] = await Promise.all([getCxcClients(), getActiveProducts()])

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear deuda</h1>
        <p className="text-sm text-muted-foreground">Registra un consumo a crédito para un cliente</p>
      </div>
      <DebtForm clients={clients} products={products} />
    </main>
  )
}
