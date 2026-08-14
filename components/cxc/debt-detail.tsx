"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteCxcDebt, deleteCxcPayment } from "@/app/cxc/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentDialog } from "@/components/cxc/payment-dialog"
import { Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  type CxcDebt,
  getCxcBalance,
  getCxcPaidAmount,
  getCxcStatus,
  getCxcStatusLabel,
  isCxcOverdue,
} from "@/lib/cxc"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => format(parseISO(d + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })

function statusBadgeClass(status: string, overdue: boolean) {
  if (status === "paid") return "bg-green-100 text-green-700"
  if (overdue) return "bg-red-100 text-red-700"
  if (status === "partial") return "bg-amber-100 text-amber-700"
  return "bg-muted text-muted-foreground"
}

export function DebtDetail({ debt }: { debt: CxcDebt }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const todayStr = new Date().toISOString().slice(0, 10)
  const paid = getCxcPaidAmount(debt)
  const balance = getCxcBalance(debt)
  const status = getCxcStatus(debt)
  const overdue = isCxcOverdue(debt, todayStr)

  function handleDeleteDebt() {
    if (!confirm("¿Eliminar esta deuda y todos sus abonos? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      const result = await deleteCxcDebt(debt.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Deuda eliminada")
        router.push("/cxc")
      }
    })
  }

  function handleDeletePayment(paymentId: string) {
    if (!confirm("¿Eliminar este abono?")) return
    startTransition(async () => {
      const result = await deleteCxcPayment(paymentId, debt.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Abono eliminado")
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/cxc")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{debt.cxc_clients?.name}</h1>
          <p className="text-sm text-muted-foreground">
            Consumo: {fmtDate(debt.consumption_date)}
            {debt.due_date && <> · Cobro tentativo: {fmtDate(debt.due_date)}</>}
          </p>
        </div>
        <Badge className={statusBadgeClass(status, overdue)}>{getCxcStatusLabel(status, overdue)}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total deuda</p>
          <p className="text-xl font-bold text-foreground">{fmt(Number(debt.total_amount))}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Abonado</p>
          <p className="text-xl font-bold text-green-600">{fmt(paid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo pendiente</p>
          <p className="text-xl font-bold text-primary">{fmt(balance)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos consumidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debt.cxc_debt_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.product_name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(Number(item.unit_price))}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(item.subtotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {debt.notes && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">{debt.notes}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Abonos / Pagos</CardTitle>
          {balance > 0 && <PaymentDialog debtId={debt.id} balance={balance} />}
        </CardHeader>
        <CardContent>
          {debt.cxc_payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin abonos registrados aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {debt.cxc_payments
                  .slice()
                  .sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1))
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmtDate(p.payment_date)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.notes || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{fmt(Number(p.amount))}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(p.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={handleDeleteDebt} disabled={isPending}>
        <Trash2 className="h-4 w-4 mr-1" />
        Eliminar deuda
      </Button>
    </div>
  )
}
