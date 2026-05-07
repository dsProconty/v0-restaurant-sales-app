"use client"

import { useState, useTransition } from "react"
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/app/expenses/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Check, X } from "lucide-react"
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

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isPending, startTransition] = useTransition()

  // New category state
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PALETTE[6])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const formData = new FormData()
    formData.set("name", newName.trim())
    formData.set("color", newColor)

    console.log("[CategoryManager] Creating category:", { name: newName, color: newColor })
    startTransition(async () => {
      const result = await createExpenseCategory(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoría creada")
        setNewName("")
        // Optimistic: re-fetch via router refresh isn't needed, page will revalidate
        // Force a quick local update
        setCategories((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: newName.trim(), color: newColor },
        ])
      }
    })
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    const formData = new FormData()
    formData.set("name", editName.trim())
    formData.set("color", editColor)

    console.log("[CategoryManager] Updating category:", { id, name: editName, color: editColor })
    startTransition(async () => {
      const result = await updateExpenseCategory(id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoría actualizada")
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: editName.trim(), color: editColor } : c))
        )
        setEditingId(null)
      }
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}"? Los gastos asociados quedarán sin categoría.`)) return

    console.log("[CategoryManager] Deleting category:", id)
    startTransition(async () => {
      const result = await deleteExpenseCategory(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoría eliminada")
        setCategories((prev) => prev.filter((c) => c.id !== id))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Nueva categoría</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              placeholder="ej: Insumos, Servicios, Personal..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: newColor === color ? "#0f172a" : "transparent",
                    transform: newColor === color ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay categorías. Crea la primera arriba.
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            {editingId === cat.id ? (
              <>
                {/* Edit mode */}
                <div className="flex gap-1.5 flex-wrap">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className="h-6 w-6 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: editColor === color ? "#0f172a" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <Input
                  className="flex-1 h-8 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <Button size="icon" className="h-8 w-8" onClick={() => handleUpdate(cat.id)} disabled={isPending}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => startEdit(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
