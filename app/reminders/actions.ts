"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, addWeeks, addMonths, format, nextDay, getDay } from "date-fns"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[reminders/actions]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Reminder {
  id: string
  title: string
  supplier: string | null
  notes: string | null
  frequency: "weekly" | "biweekly" | "monthly" | "once"
  days_of_week: number[]
  next_due: string   // "YYYY-MM-DD"
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ReminderStatus = "overdue" | "today" | "tomorrow" | "upcoming"

export interface ReminderWithStatus extends Reminder {
  status: ReminderStatus
  daysUntil: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcNextDue(frequency: string, daysOfWeek: number[]): string {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  if (frequency === "once") {
    return format(today, "yyyy-MM-dd")
  }

  if (frequency === "monthly") {
    return format(addMonths(today, 1), "yyyy-MM-dd")
  }

  // weekly / biweekly — encontrar el próximo día de la semana
  const targetDay = daysOfWeek[0] ?? 1 // default lunes
  const todayDay = getDay(today)
  let daysAhead = (targetDay - todayDay + 7) % 7
  if (daysAhead === 0) daysAhead = 7 // si es hoy, el próximo
  const next = addDays(today, daysAhead)

  if (frequency === "biweekly") {
    return format(addWeeks(next, 1), "yyyy-MM-dd")
  }

  return format(next, "yyyy-MM-dd")
}

function advanceNextDue(reminder: Reminder): string {
  const current = new Date(reminder.next_due + "T12:00:00")

  switch (reminder.frequency) {
    case "weekly":
      return format(addWeeks(current, 1), "yyyy-MM-dd")
    case "biweekly":
      return format(addWeeks(current, 2), "yyyy-MM-dd")
    case "monthly":
      return format(addMonths(current, 1), "yyyy-MM-dd")
    case "once":
    default:
      return reminder.next_due // no avanza
  }
}

function getStatus(nextDue: string): { status: ReminderStatus; daysUntil: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDue + "T00:00:00")
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0)  return { status: "overdue",  daysUntil: diff }
  if (diff === 0) return { status: "today",    daysUntil: 0 }
  if (diff === 1) return { status: "tomorrow", daysUntil: 1 }
  return           { status: "upcoming",  daysUntil: diff }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
export async function getReminders(): Promise<ReminderWithStatus[]> {
  log("Fetching reminders...")
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("is_active", true)
    .order("next_due", { ascending: true })

  if (error) {
    logError("getReminders", error)
    return []
  }

  log("Reminders OK", { count: data?.length ?? 0 })
  return (data ?? []).map((r) => ({
    ...r,
    ...getStatus(r.next_due),
  }))
}

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createReminder(formData: FormData) {
  log("createReminder called")
  const supabase = await createClient()

  const title = formData.get("title") as string
  const supplier = (formData.get("supplier") as string) || null
  const notes = (formData.get("notes") as string) || null
  const frequency = (formData.get("frequency") as string) || "weekly"
  const daysRaw = formData.getAll("days_of_week") as string[]
  const days_of_week = daysRaw.map(Number).filter((d) => !isNaN(d))
  const customDate = formData.get("custom_date") as string | null

  if (!title?.trim()) {
    logError("createReminder: title vacío")
    return { error: "El título es requerido" }
  }

  const next_due = customDate && frequency === "once"
    ? customDate
    : calcNextDue(frequency, days_of_week.length > 0 ? days_of_week : [1])

  const { error } = await supabase.from("reminders").insert({
    title: title.trim(),
    supplier,
    notes,
    frequency,
    days_of_week: days_of_week.length > 0 ? days_of_week : [1],
    next_due,
  })

  if (error) {
    logError("createReminder insert", error)
    return { error: "No se pudo crear el recordatorio" }
  }

  log("Reminder creado", { title, frequency, next_due })
  revalidatePath("/")
  revalidatePath("/reminders")
  return { success: true }
}

// ─── Mark done ───────────────────────────────────────────────────────────────
export async function markReminderDone(id: string) {
  log("markReminderDone", { id })
  const supabase = await createClient()

  // Fetch current reminder to compute next date
  const { data: reminder, error: fetchError } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !reminder) {
    logError("markReminderDone fetch", fetchError)
    return { error: "Recordatorio no encontrado" }
  }

  if (reminder.frequency === "once") {
    // Desactivar en lugar de avanzar
    const { error } = await supabase
      .from("reminders")
      .update({ is_active: false })
      .eq("id", id)

    if (error) { logError("markReminderDone deactivate", error); return { error: "Error al actualizar" } }
  } else {
    // Avanzar a la próxima fecha
    const next_due = advanceNextDue(reminder as Reminder)
    const { error } = await supabase
      .from("reminders")
      .update({ next_due })
      .eq("id", id)

    if (error) { logError("markReminderDone advance", error); return { error: "Error al actualizar" } }
    log("Next due avanzado a", next_due)
  }

  revalidatePath("/")
  revalidatePath("/reminders")
  return { success: true }
}

// ─── Snooze +1 día ───────────────────────────────────────────────────────────
export async function snoozeReminder(id: string) {
  log("snoozeReminder", { id })
  const supabase = await createClient()

  const { data: reminder, error: fetchError } = await supabase
    .from("reminders")
    .select("next_due")
    .eq("id", id)
    .single()

  if (fetchError || !reminder) {
    logError("snoozeReminder fetch", fetchError)
    return { error: "Recordatorio no encontrado" }
  }

  const next_due = format(
    addDays(new Date(reminder.next_due + "T12:00:00"), 1),
    "yyyy-MM-dd"
  )

  const { error } = await supabase
    .from("reminders")
    .update({ next_due })
    .eq("id", id)

  if (error) { logError("snoozeReminder update", error); return { error: "Error al posponer" } }

  log("Reminder pospuesto a", next_due)
  revalidatePath("/")
  revalidatePath("/reminders")
  return { success: true }
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteReminder(id: string) {
  log("deleteReminder", { id })
  const supabase = await createClient()

  const { error } = await supabase
    .from("reminders")
    .update({ is_active: false })
    .eq("id", id)

  if (error) {
    logError("deleteReminder", error)
    return { error: "No se pudo eliminar" }
  }

  log("Reminder eliminado", { id })
  revalidatePath("/")
  revalidatePath("/reminders")
  return { success: true }
}
