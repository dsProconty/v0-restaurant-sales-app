"use client"

import { useState, useEffect, useTransition } from "react"
import { X, Bell, Check, Clock, AlertTriangle } from "lucide-react"
import { markReminderDone, snoozeReminder } from "@/app/reminders/actions"
import type { ReminderWithStatus } from "@/app/reminders/actions"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[TodayRemindersPopup]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── localStorage helpers ────────────────────────────────────────────────────
const LS_KEY = "reminders_dismissed_date"

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0] // "YYYY-MM-DD"
}

function wasDismissedToday(): boolean {
  try {
    const stored = localStorage.getItem(LS_KEY)
    return stored === getTodayStr()
  } catch {
    return false
  }
}

function dismissForToday(): void {
  try {
    localStorage.setItem(LS_KEY, getTodayStr())
  } catch {
    log("localStorage no disponible")
  }
}

function clearDismissal(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}

// ─── Reminder row dentro del popup ───────────────────────────────────────────
function PopupReminderRow({
  r,
  onDone,
  onSnooze,
}: {
  r: ReminderWithStatus
  onDone: (id: string) => void
  onSnooze: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const isOverdue = r.status === "overdue"

  function handleDone() {
    log("done desde popup", { id: r.id })
    startTransition(async () => {
      await markReminderDone(r.id)
      onDone(r.id)
    })
  }

  function handleSnooze() {
    log("snooze desde popup", { id: r.id })
    startTransition(async () => {
      await snoozeReminder(r.id)
      onSnooze(r.id)
    })
  }

  return (
    <div
      className={[
        "relative flex items-start gap-3 rounded-xl border overflow-hidden px-3 py-3 transition-opacity",
        isOverdue
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40",
        isPending ? "opacity-40 pointer-events-none" : "",
      ].join(" ")}
    >
      {/* Barra lateral */}
      <div
        className={[
          "absolute left-0 top-0 bottom-0 w-1",
          isOverdue ? "bg-red-500" : "bg-[#E85D04]",
        ].join(" ")}
      />

      {/* Icono */}
      <div
        className={[
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5",
          isOverdue ? "bg-red-100 dark:bg-red-900/50" : "bg-orange-100 dark:bg-orange-900/50",
        ].join(" ")}
      >
        {isOverdue
          ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          : <Bell className="h-4 w-4 text-[#E85D04]" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {r.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className={[
              "text-[10px] font-medium px-2 py-px rounded-full",
              isOverdue
                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
            ].join(" ")}
          >
            {isOverdue ? `Vencido hace ${Math.abs(r.daysUntil)} día${Math.abs(r.daysUntil) !== 1 ? "s" : ""}` : "Hoy"}
          </span>
          {r.supplier && (
            <span className="text-xs text-muted-foreground truncate">{r.supplier}</span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <button
          onClick={handleSnooze}
          title="Posponer 1 día"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDone}
          title="Marcar como hecho"
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-[#E85D04] text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Check className="h-3.5 w-3.5" />
          Hecho
        </button>
      </div>
    </div>
  )
}

// ─── Popup principal ──────────────────────────────────────────────────────────
interface Props {
  reminders: ReminderWithStatus[]
}

export function TodayRemindersPopup({ reminders }: Props) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Filtrar solo los urgentes (hoy + vencidos)
  const urgentReminders = reminders.filter(
    r => (r.status === "today" || r.status === "overdue") && !dismissed.has(r.id)
  )

  // Montar: mostrar solo si hay urgentes Y no fue descartado hoy
  useEffect(() => {
    log("Montando popup", { urgentes: urgentReminders.length })
    if (urgentReminders.length > 0 && !wasDismissedToday()) {
      // Pequeño delay para que no sea abrupto al cargar
      const t = setTimeout(() => {
        setVisible(true)
        log("Popup visible")
      }, 600)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar popup y guardar en localStorage que fue descartado hoy
  function handleClose() {
    log("Popup cerrado — guardando en localStorage")
    dismissForToday()
    setVisible(false)
  }

  // Marcar hecho desde el popup — remover de la lista local
  function handleDone(id: string) {
    log("Eliminando del popup", { id })
    setDismissed(prev => new Set([...prev, id]))
    // Si ya no quedan urgentes, cerrar el popup automáticamente
    const remaining = urgentReminders.filter(r => r.id !== id)
    if (remaining.length === 0) {
      setTimeout(() => setVisible(false), 400)
    }
  }

  // Posponer — también sacarlo del popup por hoy
  function handleSnooze(id: string) {
    log("Posponiendo desde popup", { id })
    setDismissed(prev => new Set([...prev, id]))
    const remaining = urgentReminders.filter(r => r.id !== id)
    if (remaining.length === 0) {
      setTimeout(() => setVisible(false), 400)
    }
  }

  // Los que quedan en el popup después de acciones
  const visibleItems = urgentReminders.filter(r => !dismissed.has(r.id))

  if (!visible || visibleItems.length === 0) return null

  const overdueCount = visibleItems.filter(r => r.status === "overdue").length
  const todayCount   = visibleItems.filter(r => r.status === "today").length

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-8"
        role="dialog"
        aria-modal="true"
        aria-label="Recordatorios pendientes de hoy"
      >
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
                <Bell className="h-5 w-5 text-[#E85D04]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {overdueCount > 0 && todayCount > 0
                    ? "Recordatorios pendientes"
                    : overdueCount > 0
                    ? `${overdueCount} recordatorio${overdueCount !== 1 ? "s" : ""} vencido${overdueCount !== 1 ? "s" : ""}`
                    : `${todayCount} recordatorio${todayCount !== 1 ? "s" : ""} para hoy`
                  }
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {overdueCount > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {overdueCount} vencido{overdueCount !== 1 ? "s" : ""}
                      {todayCount > 0 ? " · " : ""}
                    </span>
                  )}
                  {todayCount > 0 && (
                    <span>{todayCount} para completar hoy</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lista de recordatorios */}
          <div className="px-5 py-4 flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto">
            {visibleItems.map(r => (
              <PopupReminderRow
                key={r.id}
                r={r}
                onDone={handleDone}
                onSnooze={handleSnooze}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 pt-1 flex items-center justify-between border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Al cerrar, no volverá a aparecer hasta mañana
            </p>
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Recordar más tarde
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
