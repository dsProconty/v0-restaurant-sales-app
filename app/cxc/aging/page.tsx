import Link from "next/link"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { getCxcDebts } from "@/app/cxc/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import { getCxcBalance } from "@/lib/cxc"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

interface Bucket {
  current: number
  d30: number
  d60: number
  d90: number
  total: number
}

function emptyBucket(): Bucket {
  return { current: 0, d30: 0, d60: 0, d90: 0, total: 0 }
}

export default async function CxcAgingPage() {
  const debts = await getCxcDebts()
  const today = new Date()

  const byClient = new Map<string, { name: string; bucket: Bucket }>()
  const grandTotal = emptyBucket()

  for (const debt of debts) {
    const balance = getCxcBalance(debt)
    if (balance <= 0) continue

    const referenceDate = debt.due_date ?? debt.consumption_date
    const daysPast = differenceInCalendarDays(today, parseISO(referenceDate + "T12:00:00"))

    const clientId = debt.client_id
    const clientName = debt.cxc_clients?.name ?? "Sin nombre"
    if (!byClient.has(clientId)) byClient.set(clientId, { name: clientName, bucket: emptyBucket() })
    const entry = byClient.get(clientId)!

    if (daysPast <= 30) {
      entry.bucket.current += balance
      grandTotal.current += balance
    } else if (daysPast <= 60) {
      entry.bucket.d30 += balance
      grandTotal.d30 += balance
    } else if (daysPast <= 90) {
      entry.bucket.d60 += balance
      grandTotal.d60 += balance
    } else {
      entry.bucket.d90 += balance
      grandTotal.d90 += balance
    }
    entry.bucket.total += balance
    grandTotal.total += balance
  }

  const rows = Array.from(byClient.values()).sort((a, b) => b.bucket.total - a.bucket.total)

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/cxc">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Antigüedad de saldos</h1>
        <p className="text-sm text-muted-foreground">
          Saldos pendientes agrupados por días transcurridos desde la fecha de cobro tentativa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hay saldos pendientes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">0-30 días</TableHead>
                  <TableHead className="text-right">31-60 días</TableHead>
                  <TableHead className="text-right">61-90 días</TableHead>
                  <TableHead className="text-right">+90 días</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                    <TableCell className="text-right">{row.bucket.current > 0 ? fmt(row.bucket.current) : "-"}</TableCell>
                    <TableCell className="text-right">{row.bucket.d30 > 0 ? fmt(row.bucket.d30) : "-"}</TableCell>
                    <TableCell className="text-right">{row.bucket.d60 > 0 ? fmt(row.bucket.d60) : "-"}</TableCell>
                    <TableCell className="text-right text-red-600">{row.bucket.d90 > 0 ? fmt(row.bucket.d90) : "-"}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(row.bucket.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableBody>
                <TableRow className="border-t-2 border-border">
                  <TableCell className="font-bold text-foreground">Total general</TableCell>
                  <TableCell className="text-right font-bold">{fmt(grandTotal.current)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(grandTotal.d30)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(grandTotal.d60)}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{fmt(grandTotal.d90)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{fmt(grandTotal.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
