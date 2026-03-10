"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Package } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  category: string | null
  is_active: boolean
}

export function ProductList({ products }: { products: Product[] }) {
  const router = useRouter()
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingProduct) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    await supabase
      .from("products")
      .update({
        name: formData.get("name") as string,
        price: parseFloat(formData.get("price") as string),
        category: (formData.get("category") as string) || null,
        is_active: formData.get("is_active") === "on",
      })
      .eq("id", editingProduct.id)

    setEditingProduct(null)
    setIsSubmitting(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deletingProduct) return

    setIsSubmitting(true)
    await supabase.from("products").delete().eq("id", deletingProduct.id)
    setDeletingProduct(null)
    setIsSubmitting(false)
    router.refresh()
  }

  async function toggleActive(product: Product) {
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id)
    router.refresh()
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay productos aún</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Agrega tu primer producto para comenzar a registrar ventas
          </p>
        </CardContent>
      </Card>
    )
  }

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todos los Productos</CardTitle>
          <CardDescription>
            {products.length} producto{products.length !== 1 ? "s" : ""} en total
            {categories.length > 0 && ` en ${categories.length} categoría${categories.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    ${product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => toggleActive(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProduct(product)}
                      >
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

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Actualiza los detalles del producto a continuación.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingProduct.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Precio</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduct.price}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Categoría (opcional)</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    defaultValue={editingProduct.category || ""}
                    placeholder="Ej: Entradas, Plato Principal, Bebidas"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-is_active"
                    name="is_active"
                    defaultChecked={editingProduct.is_active}
                  />
                  <Label htmlFor="edit-is_active">Activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{deletingProduct?.name}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingProduct(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
