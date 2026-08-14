"use client"

import { useState, useTransition } from "react"
import { createCxcClient } from "@/app/cxc/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"
import type { CxcClient } from "@/lib/cxc"

export function AddClientDialog({
  onCreated,
  trigger,
}: {
  onCreated?: (client: CxcClient) => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!(formData.get("name") as string)?.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    startTransition(async () => {
      const result = await createCxcClient(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cliente creado")
        setOpen(false)
        if (result.client && onCreated) onCreated(result.client)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>Registra un cliente para poder asignarle deudas a crédito.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" placeholder="Ej: Juan Pérez" required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="Ej: 099 123 4567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Información adicional..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
