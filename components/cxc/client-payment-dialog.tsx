"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createCxcClientPayment } from "@/app/cxc/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, HandCoins, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

interface ClientPaymentDialogProps {
  clientId: string
  clientName: string
  balance: number
  mode: "abono" | "settle"
  trigger?: React.ReactNode
  onDone?: () => void
}

export function ClientPaymentDialog({ clientId, clientName, balance, mode, trigger, onDone }: ClientPaymentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState(mode === "settle" ? balance.toFixed(2) : "")
  const [date, setDate] = useState<Date>(new Date())
  const [calOpen, setCalOpen] = useState(false)
  const [notes, setNotes] = useState(mode === "settle" ? "Cancelación total de deuda" : "")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setAmount(mode === "settle" ? balance.toFixed(2) : "")
      setDate(new Date())
      setNotes(mode === "settle" ? "Cancelación total de deuda" : "")
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("amount", amount)
    formData.set("payment_date", format(date, "yyyy-MM-dd"))
    if (notes.trim()) formData.set("notes", notes.trim())

    startTransition(async () => {
      const result = await createCxcClientPayment(clientId, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(mode === "settle" ? "Deuda cancelada" : "Abono registrado")
        setOpen(false)
        router.refresh()
        onDone?.()
      }
    })
  }

  const title = mode === "settle" ? "Cancelar deuda" : "Registrar abono"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={mode === "settle" ? "outline" : "default"}>
            {mode === "settle" ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <HandCoins className="h-4 w-4 mr-1" />}
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} · {clientName}</DialogTitle>
          <DialogDescription>
            {mode === "settle"
              ? `Esto registrará un abono por el saldo total pendiente (${fmt(balance)}) y saldará todas sus deudas.`
              : `Saldo pendiente: ${fmt(balance)}. El abono se aplica primero a las deudas con cobro más próximo.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                className="pl-7"
                type="number"
                step="0.01"
                min="0"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus={mode === "abono"}
                readOnly={mode === "settle"}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha *</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "d 'de' MMMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setCalOpen(false) } }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
