"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientPaymentDialog } from "@/components/cxc/client-payment-dialog"
import { NewDebtDialog } from "@/components/cxc/new-debt-dialog"
import { PlusCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  type CxcClient,
  type CxcDebt,
  getCxcBalance,
  getCxcStatus,
  getCxcStatusLabel,
  isCxcOverdue,
  summarizeClientDebts,
} from "@/lib/cxc"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => format(parseISO(d + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })

function statusBadgeClass(status: string, overdue: boolean) {
  if (status === "paid") return "bg-green-100 text-green-700"
  if (overdue) return "bg-red-100 text-red-700"
  if (status === "partial") return "bg-amber-100 text-amber-700"
  return "bg-muted text-muted-foreground"
}

interface Product {
  id: string
  name: string
  category: string
  price: number
}

export function ClientDetailContent({
  client,
  debts,
  products,
  allClients,
}: {
  client: CxcClient
  debts: CxcDebt[]
  products?: Product[]
  allClients?: CxcClient[]
}) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const [summary] = summarizeClientDebts(debts, todayStr)
  const totalAmount = summary?.totalAmount ?? 0
  const totalPaid = summary?.totalPaid ?? 0
  const totalBalance = summary?.totalBalance ?? 0
  const status = summary?.status ?? "pending"
  const overdue = summary?.overdue ?? false

  const allPayments = debts
    .flatMap((d) => d.cxc_payments.map((p) => ({ ...p, debt: d })))
    .sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client.phone || "Sin teléfono registrado"}
          </p>
        </div>
        <Badge className={statusBadgeClass(status, overdue)}>{getCxcStatusLabel(status, overdue)}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total consumido</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Abonado</p>
          <p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo pendiente</p>
          <p className="text-xl font-bold text-primary">{fmt(totalBalance)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {totalBalance > 0.001 && (
          <ClientPaymentDialog clientId={client.id} clientName={client.name} balance={totalBalance} mode="abono" />
        )}
        {totalBalance > 0.001 && (
          <ClientPaymentDialog clientId={client.id} clientName={client.name} balance={totalBalance} mode="settle" />
        )}
        {products && allClients ? (
          <NewDebtDialog
            clients={allClients}
            products={products}
            defaultClientId={client.id}
            trigger={
              <Button size="sm" variant="outline">
                <PlusCircle className="h-4 w-4 mr-1" />
                Nuevo consumo
              </Button>
            }
          />
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/cxc/new?client=${client.id}`}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Nuevo consumo
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumos</CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin consumos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de consumo</TableHead>
                  <TableHead>Cobro tentativo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => {
                  const balance = getCxcBalance(debt)
                  const debtStatus = getCxcStatus(debt)
                  const debtOverdue = isCxcOverdue(debt, todayStr)
                  return (
                    <TableRow key={debt.id} className="cursor-pointer">
                      <TableCell className="p-0">
                        <Link href={`/cxc/${debt.id}`} className="flex px-4 py-3 font-medium text-foreground">
                          {fmtDate(debt.consumption_date)}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link href={`/cxc/${debt.id}`} className="flex px-4 py-3 text-muted-foreground">
                          {debt.due_date ? fmtDate(debt.due_date) : "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link href={`/cxc/${debt.id}`} className="flex px-4 py-3 justify-end">
                          {fmt(Number(debt.total_amount))}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link href={`/cxc/${debt.id}`} className="flex px-4 py-3 justify-end font-medium">
                          {fmt(balance)}
                        </Link>
                      </TableCell>
                      <TableCell className="p-0">
                        <Link href={`/cxc/${debt.id}`} className="flex px-4 py-3 justify-center">
                          <Badge className={statusBadgeClass(debtStatus, debtOverdue)}>
                            {getCxcStatusLabel(debtStatus, debtOverdue)}
                          </Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de abonos</CardTitle>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin abonos registrados aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Aplicado a consumo</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{fmtDate(p.payment_date)}</TableCell>
                    <TableCell>
                      <Link href={`/cxc/${p.debt.id}`} className="text-primary hover:underline">
                        {fmtDate(p.debt.consumption_date)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.notes || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{fmt(Number(p.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
