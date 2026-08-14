import { getCxcClients, getCxcDebts } from "@/app/cxc/actions"
import { ClientsList } from "@/components/cxc/clients-list"
import { AddClientDialog } from "@/components/cxc/add-client-dialog"
import { getCxcBalance } from "@/lib/cxc"

export default async function CxcClientsPage() {
  const [clients, debts] = await Promise.all([getCxcClients(), getCxcDebts()])

  const balanceByClient = new Map<string, number>()
  for (const debt of debts) {
    const balance = getCxcBalance(debt)
    balanceByClient.set(debt.client_id, (balanceByClient.get(debt.client_id) || 0) + balance)
  }

  const rows = clients.map((c) => ({ ...c, balance: balanceByClient.get(c.id) || 0 }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes con crédito</h1>
            <p className="text-muted-foreground">Administra los clientes que pueden consumir a cuenta</p>
          </div>
          <AddClientDialog />
        </div>
        <ClientsList clients={rows} />
      </div>
    </main>
  )
}
