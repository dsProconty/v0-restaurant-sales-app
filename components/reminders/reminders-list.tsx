"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { markReminderDone, snoozeReminder, deleteReminder } from "@/app/reminders/actions"
import type { ReminderWithStatus } from "@/app/reminders/actions"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[RemindersList]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
  overdue:  { bar: "bg-red-500",      badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",      label: "Vencido" },
  today:    { bar: "bg-[#E85D04]",    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "Hoy" },
  tomorrow: { bar: "bg-blue-400",     badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",  label: "Mañana" },
  upcoming: { bar: "bg-muted-foreground/30", badge: "bg-muted text-muted-foreground", label: "Próximo" },
}

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual", once: "Una vez",
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

function dueDateLabel(r: ReminderWithStatus): string {
  if (r.status === "overdue") {
    const n = Math.abs(r.daysUntil)
    return `Venció hace ${n} día${n !== 1 ? "s" : ""}`
  }
  if (r.status === "today") return "Hoy"
  if (r.status === "tomorrow") return "Mañana"
  return `En ${r.daysUntil} días · ${format(new Date(r.next_due + "T12:00:00"), "d MMM", { locale: es })}`
}

// ─── Single reminder card ─────────────────────────────────────────────────────
function ReminderCard({ reminder }: { reminder: ReminderWithStatus }) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const styles = STATUS_STYLES[reminder.status]

  function handleDone() {
    log("markDone", { id: reminder.id })
    startTransition(async () => {
      await markReminderDone(reminder.id)
    })
  }

  function handleSnooze() {
    log("snooze", { id: reminder.id })
    startTransition(async () => {
      await snoozeReminder(reminder.id)
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${reminder.title}"?`)) return
    log("delete", { id: reminder.id })
    startTransition(async () => {
      await deleteReminder(reminder.id)
    })
  }

  return (
    <div
      className={[
        "relative rounded-xl border border-border bg-card overflow-hidden transition-opacity",
        isPending ? "opacity-50 pointer-events-none" : "",
      ].join(" ")}
    >
      {/* Barra de estado lateral */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />

      <div className="pl-4 pr-4 py-3">
        <div className="flex items-start gap-3">
          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}
              >
                {styles.label}
              </span>
              <span className="text-xs text-muted-foreground">{dueDateLabel(reminder)}</span>
            </div>

            <p className="text-sm font-medium text-foreground leading-snug">
              {reminder.title}
            </p>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {reminder.supplier && (
                <span className="text-xs text-muted-foreground">
                  {reminder.supplier}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {FREQ_LABELS[reminder.frequency] ?? reminder.frequency}
                {reminder.days_of_week?.length > 0 && (
                  <> · {reminder.days_of_week.map(d => DAY_LABELS[d]).join(", ")}</>
                )}
              </span>
            </div>

            {/* Notas expandibles */}
            {reminder.notes && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5 hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Ocultar notas" : "Ver notas"}
              </button>
            )}
            {expanded && reminder.notes && (
              <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded-md px-2.5 py-2">
                {reminder.notes}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {reminder.status !== "upcoming" && (
              <button
                onClick={handleSnooze}
                title="Posponer 1 día"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleDone}
              title="Marcar como hecho"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E85D04] text-white hover:opacity-90 transition-opacity"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              title="Eliminar recordatorio"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────
interface Props {
  reminders: ReminderWithStatus[]
}

export function RemindersList({ reminders }: Props) {
  log("Render", { count: reminders.length })

  if (reminders.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {reminders.map((r) => (
        <ReminderCard key={r.id} reminder={r} />
      ))}
    </div>
  )
}
