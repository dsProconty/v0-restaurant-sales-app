import { getReminders } from "@/app/reminders/actions"
import { RemindersList } from "@/components/reminders/reminders-list"
import { CreateReminderForm } from "@/components/reminders/create-reminder-form"
import { Bell } from "lucide-react"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[reminders/page]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

export default async function RemindersPage() {
  log("Renderizando RemindersPage")
  let reminders = []

  try {
    reminders = await getReminders()
    log("Recordatorios cargados", { count: reminders.length })
  } catch (err) {
    logError("Error al cargar recordatorios", err)
  }

  const overdue  = reminders.filter((r) => r.status === "overdue")
  const today    = reminders.filter((r) => r.status === "today")
  const upcoming = reminders.filter((r) => r.status === "tomorrow" || r.status === "upcoming")
  const urgent   = overdue.length + today.length

  return (
    <div>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Recordatorios
                </h1>
                {urgent > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#E85D04] text-white text-xs font-semibold">
                    {urgent}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Pedidos a proveedores y compras recurrentes del restaurante
              </p>
            </div>
            <CreateReminderForm />
          </div>

          {/* Urgentes: vencidos + hoy */}
          {(overdue.length > 0 || today.length > 0) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Requieren atención
              </p>
              <RemindersList reminders={[...overdue, ...today]} />
            </div>
          )}

          {/* Próximos */}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Próximos
              </p>
              <RemindersList reminders={upcoming} />
            </div>
          )}

          {/* Empty state */}
          {reminders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                Sin recordatorios activos
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Crea tu primer recordatorio para no olvidar pedidos a proveedores o compras recurrentes.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
