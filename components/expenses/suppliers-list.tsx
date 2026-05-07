"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateSupplier, deleteSupplier } from "@/app/expenses/actions"
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
import { Pencil, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"

interface Supplier {
  id: string
  name: string
  contact: string | null
  phone: string | null
  notes: string | null
  is_active: boolean
}

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateSupplier(editing.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Proveedor actualizado")
        setEditing(null)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteSupplier(deleting.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Proveedor eliminado")
        setDeleting(null)
        router.refresh()
      }
    })
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay proveedores aún</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Agrega tu primer proveedor para llevar el registro de tus compras
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todos los Proveedores</CardTitle>
          <CardDescription>
            {suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""} registrado{suppliers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.contact || <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.phone || <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.is_active ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}>
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
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>Actualiza los datos del proveedor.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required autoFocus />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact">Contacto</Label>
                  <Input id="edit-contact" name="contact" defaultValue={editing.contact || ""} />
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
                  {isPending ? "Guardando..." : "Guardar Cambios"}
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
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription>
              ¿Eliminar el proveedor &quot;{deleting?.name}&quot;? Esta acción no se puede deshacer.
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
