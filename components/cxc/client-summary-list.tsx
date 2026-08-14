"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientPaymentDialog } from "@/components/cxc/client-payment-dialog"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { type CxcDebt, getCxcStatusLabel, summarizeClientDebts } from "@/lib/cxc"
import { Eye, PlusCircle, Receipt } from "lucide-react"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => format(parseISO(d + "T12:00:00"), "d MMM yyyy", { locale: es })

function statusBadgeClass(status: string, overdue: boolean) {
  if (status === "paid") return "bg-green-100 text-green-700"
  if (overdue) return "bg-red-100 text-red-700"
  if (status === "partial") return "bg-amber-100 text-amber-700"
  return "bg-muted text-muted-foreground"
}

export function ClientSummaryList({ debts }: { debts: CxcDebt[] }) {
  const [filter, setFilter] = useState<string>("open")
  const todayStr = new Date().toISOString().slice(0, 10)

  const summaries = useMemo(() => summarizeClientDebts(debts, todayStr), [debts, todayStr])

  const rows = useMemo(() => {
    return summaries
      .filter((s) => {
        if (filter === "open") return s.totalBalance > 0.001
        if (filter === "overdue") return s.overdue
        if (filter === "paid") return s.status === "paid"
        return true
      })
      .sort((a, b) => b.totalBalance - a.totalBalance)
  }, [summaries, filter])

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Deudas por cliente</p>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Con saldo</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay deudas</h3>
            <p className="mt-2 text-sm text-muted-foreground">No se encontraron registros para este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Consumos</TableHead>
                  <TableHead>Último consumo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.client.id}>
                    <TableCell className="font-medium text-foreground">{row.client.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.debtCount}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.lastConsumptionDate)}</TableCell>
                    <TableCell className="text-right">{fmt(row.totalAmount)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(row.totalBalance)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusBadgeClass(row.status, row.overdue)}>
                        {getCxcStatusLabel(row.status, row.overdue)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {row.totalBalance > 0.001 && (
                          <ClientPaymentDialog
                            clientId={row.client.id}
                            clientName={row.client.name}
                            balance={row.totalBalance}
                            mode="abono"
                            trigger={
                              <Button size="sm" variant="outline">
                                Abono
                              </Button>
                            }
                          />
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/cxc/clients/${row.client.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalles
                          </Link>
                        </Button>
                        {row.totalBalance > 0.001 && (
                          <ClientPaymentDialog
                            clientId={row.client.id}
                            clientName={row.client.name}
                            balance={row.totalBalance}
                            mode="settle"
                            trigger={
                              <Button size="sm" variant="outline">
                                Cancelar deuda
                              </Button>
                            }
                          />
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/cxc/new?client=${row.client.id}`}>
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Nuevo consumo
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
