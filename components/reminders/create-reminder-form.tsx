"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, X } from "lucide-react"
import { createReminder } from "@/app/reminders/actions"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[CreateReminderForm]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

const DAYS = [
  { label: "L", value: 1, full: "Lunes" },
  { label: "M", value: 2, full: "Martes" },
  { label: "X", value: 3, full: "Miércoles" },
  { label: "J", value: 4, full: "Jueves" },
  { label: "V", value: 5, full: "Viernes" },
  { label: "S", value: 6, full: "Sábado" },
  { label: "D", value: 0, full: "Domingo" },
]

const FREQ_OPTIONS = [
  { value: "weekly",   label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly",  label: "Mensual" },
  { value: "once",     label: "Una sola vez" },
]

export function CreateReminderForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedDays, setSelectedDays] = useState<number[]>([1])
  const [frequency, setFrequency] = useState("weekly")
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function toggleDay(val: number) {
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData(e.currentTarget)
    // Inject selected days manually
    selectedDays.forEach(d => fd.append("days_of_week", String(d)))

    log("Submitting", { frequency, selectedDays })

    startTransition(async () => {
      try {
        const result = await createReminder(fd)
        if (result?.error) {
          logError("createReminder error", result.error)
          setError(result.error)
          return
        }
        log("Reminder creado exitosamente")
        setOpen(false)
        setSelectedDays([1])
        setFrequency("weekly")
        formRef.current?.reset()
      } catch (err) {
        logError("Unexpected error", err)
        setError("Error inesperado al guardar")
      }
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#E85D04] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
        Nuevo recordatorio
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">Nuevo recordatorio</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Descripción *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ej: Compra de verduras al mercado"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]"
                />
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Proveedor <span className="font-normal">(opcional)</span>
                </label>
                <input
                  name="supplier"
                  type="text"
                  placeholder="Ej: Don Pepe, Mercado Central..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]"
                />
              </div>

              {/* Frecuencia */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Frecuencia
                </label>
                <select
                  name="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]"
                >
                  {FREQ_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Días de la semana — solo para weekly/biweekly */}
              {(frequency === "weekly" || frequency === "biweekly") && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Día(s) de la semana
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        title={d.full}
                        onClick={() => toggleDay(d.value)}
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium border transition-all",
                          selectedDays.includes(d.value)
                            ? "bg-[#E85D04] border-[#E85D04] text-white"
                            : "border-border text-muted-foreground hover:border-border hover:text-foreground",
                        ].join(" ")}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fecha para "una sola vez" */}
              {frequency === "once" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Fecha
                  </label>
                  <input
                    name="custom_date"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]"
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Notas <span className="font-normal">(opcional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ej: Pedir también sal y aceite si hay..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04] resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-[#E85D04] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
