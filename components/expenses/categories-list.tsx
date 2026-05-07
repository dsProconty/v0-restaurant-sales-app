"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateExpenseCategory, deleteExpenseCategory } from "@/app/expenses/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Pencil, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  color: string
}

const PALETTE = [
  "#e85d04", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#6366f1", "#a855f7",
  "#ec4899", "#64748b",
]

export function CategoriesList({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [isPending, startTransition] = useTransition()

  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  function startEdit(c: Category) {
    setEditing(c)
    setEditName(c.name)
    setEditColor(c.color)
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing || !editName.trim()) return

    const formData = new FormData()
    formData.set("name", editName.trim())
    formData.set("color", editColor)

    startTransition(async () => {
      const result = await updateExpenseCategory(editing.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoría actualizada")
        setEditing(null)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteExpenseCategory(deleting.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoría eliminada")
        setDeleting(null)
        router.refresh()
      }
    })
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay categorías aún</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Agrega tu primera categoría para organizar tus gastos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todas las Categorías</CardTitle>
          <CardDescription>
            {categories.length} categoría{categories.length !== 1 ? "s" : ""} registrada{categories.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Color</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(cat)}>
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
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>Actualiza el nombre o color.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="h-8 w-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor: editColor === c ? "#0f172a" : "transparent",
                          transform: editColor === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending || !editName.trim()}>
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
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Eliminar la categoría &quot;{deleting?.name}&quot;? Los gastos asociados quedarán sin categoría.
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
