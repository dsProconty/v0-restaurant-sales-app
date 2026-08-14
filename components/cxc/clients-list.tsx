"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateCxcClient, deleteCxcClient } from "@/app/cxc/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import type { CxcClient } from "@/lib/cxc"

interface ClientRow extends CxcClient {
  balance: number
}

export function ClientsList({ clients }: { clients: ClientRow[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [deleting, setDeleting] = useState<ClientRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateCxcClient(editing.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cliente actualizado")
        setEditing(null)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteCxcClient(deleting.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cliente eliminado")
        setDeleting(null)
        router.refresh()
      }
    })
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay clientes aún</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Agrega tu primer cliente para poder registrarle deudas a crédito
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todos los clientes</CardTitle>
          <CardDescription>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Saldo pendiente</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone || <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${c.balance > 0 ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {fmt(c.balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.is_active ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Actualiza los datos del cliente.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required autoFocus />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editing.phone || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notas</Label>
                  <Textarea id="edit-notes" name="notes" defaultValue={editing.notes || ""} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="edit-is_active" name="is_active" defaultChecked={editing.is_active} />
                  <Label htmlFor="edit-is_active">Activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              ¿Eliminar al cliente &quot;{deleting?.name}&quot;? Esto también eliminará sus deudas registradas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
