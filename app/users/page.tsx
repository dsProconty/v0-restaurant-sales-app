import { getUsers } from "@/app/users/actions"
import { UsersList } from "@/components/users/users-list"
import { AddUserDialog } from "@/components/users/add-user-dialog"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Usuarios</h1>
            <p className="text-muted-foreground">
              Administra quién puede ingresar al sistema
            </p>
          </div>
          <AddUserDialog />
        </div>
        <UsersList users={users} />
      </div>
    </main>
  )
}
