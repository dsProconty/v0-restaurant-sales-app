import Link from "next/link"
import { getCxcDebts, getCxcClients, getActiveProducts } from "@/app/cxc/actions"
import { ClientSummaryList } from "@/components/cxc/client-summary-list"
import { NewDebtDialog } from "@/components/cxc/new-debt-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, TrendingUp } from "lucide-react"
import { getCxcBalance, isCxcOverdue } from "@/lib/cxc"

export default async function CxcPage() {
  const [debts, clients, products] = await Promise.all([getCxcDebts(), getCxcClients(), getActiveProducts()])
  const todayStr = new Date().toISOString().slice(0, 10)

  const totalPending = debts.reduce((sum, d) => sum + Math.max(getCxcBalance(d), 0), 0)
  const totalOverdue = debts
    .filter((d) => isCxcOverdue(d, todayStr))
    .reduce((sum, d) => sum + getCxcBalance(d), 0)
  const clientsWithBalance = new Set(
    debts.filter((d) => getCxcBalance(d) > 0).map((d) => d.client_id)
  ).size

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cuentas por Cobrar</h1>
          <p className="text-sm text-muted-foreground">Deudas y consumos a crédito de clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cxc/clients">
              <Users className="h-4 w-4 mr-1" />
              Clientes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cxc/aging">
              <TrendingUp className="h-4 w-4 mr-1" />
              Antigüedad de saldos
            </Link>
          </Button>
          <NewDebtDialog
            clients={clients}
            products={products}
            trigger={
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
                Crear deuda
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total por cobrar</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Vencido</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalOverdue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Clientes con saldo</p>
          <p className="text-xl font-bold text-primary">{clientsWithBalance}</p>
        </div>
      </div>

      <ClientSummaryList debts={debts} clients={clients} products={products} />
    </main>
  )
}
