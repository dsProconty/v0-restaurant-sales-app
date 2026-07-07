"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { resetPassword, deleteUser, type AppUser } from "@/app/users/actions"
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
import { KeyRound, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

export function UsersList({ users }: { users: AppUser[] }) {
  const router = useRouter()
  const [resetting, setResetting] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState<AppUser | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resetting) return
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await resetPassword(resetting.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Contraseña actualizada")
        setResetting(null)
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteUser(deleting.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Usuario eliminado")
        setDeleting(null)
        router.refresh()
      }
    })
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay usuarios aún</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea el primer usuario para poder ingresar al sistema
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>
            {users.length} usuario{users.length !== 1 ? "s" : ""} con acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden sm:table-cell">Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">{u.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {format(new Date(u.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setResetting(u)}>
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Cambiar contraseña</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(u)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reset password dialog */}
      <Dialog open={!!resetting} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para &quot;{resetting?.display_name}&quot; ({resetting?.username}).
            </DialogDescription>
          </DialogHeader>
          {resetting && (
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nueva contraseña *</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetting(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar"}
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
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Eliminar a &quot;{deleting?.display_name}&quot;? Ya no podrá ingresar al sistema. Esta acción no se puede deshacer.
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
