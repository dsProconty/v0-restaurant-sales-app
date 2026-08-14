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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Receipt } from "lucide-react"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => format(parseISO(d + "T12:00:00"), "d MMM yyyy", { locale: es })

function statusBadgeClass(status: string, overdue: boolean) {
  if (status === "paid") return "bg-green-100 text-green-700"
  if (overdue) return "bg-red-100 text-red-700"
  if (status === "partial") return "bg-amber-100 text-amber-700"
  return "bg-muted text-muted-foreground"
}

export function DebtsList({ debts }: { debts: CxcDebt[] }) {
  const [filter, setFilter] = useState<string>("open")
  const todayStr = new Date().toISOString().slice(0, 10)

  const rows = useMemo(() => {
    return debts
      .map((debt) => ({
        debt,
        balance: getCxcBalance(debt),
        paid: getCxcPaidAmount(debt),
        status: getCxcStatus(debt),
        overdue: isCxcOverdue(debt, todayStr),
      }))
      .filter((row) => {
        if (filter === "open") return row.balance > 0
        if (filter === "overdue") return row.overdue
        if (filter === "paid") return row.status === "paid"
        return true
      })
  }, [debts, filter, todayStr])

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Deudas</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Consumo</TableHead>
                <TableHead>Cobro tentativo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ debt, balance, status, overdue }) => (
                <TableRow key={debt.id} className="cursor-pointer">
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 font-medium text-foreground">
                      {debt.cxc_clients?.name}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 text-muted-foreground">
                      {fmtDate(debt.consumption_date)}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 text-muted-foreground">
                      {debt.due_date ? fmtDate(debt.due_date) : "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 justify-end">
                      {fmt(Number(debt.total_amount))}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 justify-end font-medium">
                      {fmt(balance)}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={`/cxc/${debt.id}`} className="flex h-full w-full px-4 py-3 justify-center">
                      <Badge className={statusBadgeClass(status, overdue)}>{getCxcStatusLabel(status, overdue)}</Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
