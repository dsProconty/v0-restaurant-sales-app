"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createCxcDebt } from "@/app/cxc/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddClientDialog } from "@/components/cxc/add-client-dialog"
import { CalendarIcon, Save, PlusCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import type { CxcClient } from "@/lib/cxc"

interface Product {
  id: string
  name: string
  category: string
  price: number
}

interface ItemRow {
  key: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
}

const CUSTOM_VALUE = "__custom__"

export function DebtForm({ clients, products }: { clients: CxcClient[]; products: Product[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clientList, setClientList] = useState(clients)
  const [clientId, setClientId] = useState<string>("")
  const [consumptionDate, setConsumptionDate] = useState<Date>(new Date())
  const [consumptionCalOpen, setConsumptionCalOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueCalOpen, setDueCalOpen] = useState(false)
  const [notes, setNotes] = useState("")

  const [items, setItems] = useState<ItemRow[]>([])
  const [pickerProductId, setPickerProductId] = useState<string>("")
  const [pickerName, setPickerName] = useState("")
  const [pickerQty, setPickerQty] = useState("1")
  const [pickerPrice, setPickerPrice] = useState("")

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

  function handlePickProduct(value: string) {
    setPickerProductId(value)
    if (value === CUSTOM_VALUE) {
      setPickerName("")
      setPickerPrice("")
      return
    }
    const product = products.find((p) => p.id === value)
    if (product) {
      setPickerName(product.name)
      setPickerPrice(String(product.price))
    }
  }

  function handleAddItem() {
    const qty = parseInt(pickerQty, 10)
    const price = parseFloat(pickerPrice)

    if (!pickerName.trim()) {
      toast.error("Selecciona o escribe un producto")
      return
    }
    if (!qty || qty <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }
    if (isNaN(price) || price < 0) {
      toast.error("El precio no es válido")
      return
    }

    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        product_id: pickerProductId === CUSTOM_VALUE || !pickerProductId ? null : pickerProductId,
        product_name: pickerName.trim(),
        quantity: qty,
        unit_price: price,
      },
    ])

    setPickerProductId("")
    setPickerName("")
    setPickerQty("1")
    setPickerPrice("")
  }

  function handleRemoveItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!clientId) {
      toast.error("Selecciona un cliente")
      return
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto consumido")
      return
    }

    startTransition(async () => {
      const result = await createCxcDebt({
        client_id: clientId,
        consumption_date: format(consumptionDate, "yyyy-MM-dd"),
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        notes: notes.trim() || null,
        items: items.map(({ product_id, product_name, quantity, unit_price }) => ({
          product_id,
          product_name,
          quantity,
          unit_price,
        })),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Deuda registrada")
        router.push("/cxc")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <div className="space-y-1.5">
        <Label>Cliente *</Label>
        <div className="flex gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddClientDialog
            trigger={
              <Button type="button" variant="outline" size="icon">
                <PlusCircle className="h-4 w-4" />
              </Button>
            }
            onCreated={(client) => {
              setClientList((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
              setClientId(client.id)
            }}
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Fecha de consumo *</Label>
          <Popover open={consumptionCalOpen} onOpenChange={setConsumptionCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(consumptionDate, "d 'de' MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={consumptionDate}
                onSelect={(d) => { if (d) { setConsumptionDate(d); setConsumptionCalOpen(false) } }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label>Fecha tentativa de cobro</Label>
          <Popover open={dueCalOpen} onOpenChange={setDueCalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "d 'de' MMM yyyy", { locale: es }) : "Sin definir"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(d) => { setDueDate(d); setDueCalOpen(false) }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Productos consumidos */}
      <div className="space-y-3">
        <Label>Productos consumidos *</Label>

        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={pickerProductId} onValueChange={handlePickProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir del catálogo" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {fmt(p.price)}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_VALUE}>Otro (personalizado)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Nombre del producto"
              value={pickerName}
              onChange={(e) => setPickerName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cantidad</Label>
              <Input type="number" min="1" step="1" value={pickerQty} onChange={(e) => setPickerQty(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Precio unitario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  className="pl-7"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pickerPrice}
                  onChange={(e) => setPickerPrice(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddItem}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-medium text-foreground">{item.product_name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(item.quantity * item.unit_price)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.key)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex justify-end">
          <p className="text-sm text-muted-foreground">
            Total: <span className="text-lg font-bold text-foreground">{fmt(total)}</span>
          </p>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
        <Textarea
          placeholder="Cualquier observación adicional..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Guardando..." : "Registrar deuda"}
        </Button>
      </div>
    </form>
  )
}
