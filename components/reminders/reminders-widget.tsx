"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Bell, Check, Clock, Plus, ChevronRight } from "lucide-react"
import { markReminderDone, snoozeReminder } from "@/app/reminders/actions"
import type { ReminderWithStatus } from "@/app/reminders/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TodayRemindersPopup } from "@/components/reminders/today-reminders-popup"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[RemindersWidget]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Estilos por status/día ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  accent: string
  pillBg: string
  pillText: string
  label: string
  sepColor: string
}> = {
  overdue:  { accent: "bg-red-500",            pillBg: "bg-red-100 dark:bg-red-900/30",      pillText: "text-red-800 dark:text-red-400",      label: "Vencido", sepColor: "text-red-700 dark:text-red-400" },
  today:    { accent: "bg-[#E85D04]",           pillBg: "bg-orange-100 dark:bg-orange-900/30", pillText: "text-orange-800 dark:text-orange-400", label: "Hoy",     sepColor: "text-[#C44D04] dark:text-orange-400" },
  tomorrow: { accent: "bg-blue-400",            pillBg: "bg-blue-100 dark:bg-blue-900/30",    pillText: "text-blue-800 dark:text-blue-400",    label: "Mañana",  sepColor: "text-blue-700 dark:text-blue-400" },
  upcoming: { accent: "bg-muted-foreground/40", pillBg: "bg-muted",                           pillText: "text-muted-foreground",               label: "Próximo", sepColor: "text-muted-foreground" },
}

const DOW_ACCENT: Record<number, string> = {
  1: "bg-blue-400", 2: "bg-purple-400", 3: "bg-[#E85D04]",
  4: "bg-teal-500", 5: "bg-amber-600",  6: "bg-violet-500", 0: "bg-gray-400",
}

function getAccent(r: ReminderWithStatus): string {
  if (r.status === "overdue")  return "bg-red-500"
  if (r.status === "today")    return "bg-[#E85D04]"
  if (r.status === "tomorrow") return "bg-blue-400"
  const dow = new Date(r.next_due + "T12:00:00").getDay()
  return DOW_ACCENT[dow] ?? "bg-muted-foreground/40"
}

function getPillLabel(r: ReminderWithStatus): string {
  if (r.status === "overdue")  return `Vencido hace ${Math.abs(r.daysUntil)}d`
  if (r.status === "today")    return "Hoy"
  if (r.status === "tomorrow") return "Mañana"
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
  const d = new Date(r.next_due + "T12:00:00")
  return `${days[d.getDay()]} ${d.getDate()}`
}

// ─── Separador de día ─────────────────────────────────────────────────────────
function DaySeparator({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1.5 first:mt-0">
      <span className={`text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${colorClass}`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─── Reminder row ─────────────────────────────────────────────────────────────
function ReminderRow({ r }: { r: ReminderWithStatus }) {
  const [isPending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.upcoming
  const accentClass = getAccent(r)
  const pillLabel = getPillLabel(r)

  function handleDone(e: React.MouseEvent) {
    e.preventDefault()
    log("done", { id: r.id })
    startTransition(async () => { await markReminderDone(r.id) })
  }

  function handleSnooze(e: React.MouseEvent) {
    e.preventDefault()
    log("snooze", { id: r.id })
    startTransition(async () => { await snoozeReminder(r.id) })
  }

  return (
    <div className={[
      "relative flex items-center gap-2.5 rounded-lg border border-border bg-card",
      "pl-3 pr-2.5 py-2 overflow-hidden transition-opacity",
      isPending ? "opacity-40 pointer-events-none" : "",
    ].join(" ")}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate leading-snug">{r.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`text-[9px] font-medium px-1.5 py-px rounded-full ${cfg.pillBg} ${cfg.pillText}`}>
            {pillLabel}
          </span>
          {r.supplier && (
            <span className="text-[10px] text-muted-foreground truncate">{r.supplier}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {(r.status === "overdue" || r.status === "today") && (
          <button onClick={handleSnooze} title="Posponer 1 día"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Clock className="h-3 w-3" />
          </button>
        )}
        <button onClick={handleDone} title="Marcar como hecho"
          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E85D04] text-white hover:opacity-85 transition-opacity">
          <Check className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Grupos de la semana ──────────────────────────────────────────────────────
interface DayGroup {
  key: string
  label: string
  colorClass: string
  items: ReminderWithStatus[]
}

function buildWeekGroups(reminders: ReminderWithStatus[]): DayGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = reminders.filter(r => r.status === "overdue")
  const thisWeekGroups: DayGroup[] = []
  const DAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
  const daysAhead = 7 - today.getDay()

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const items = reminders.filter(r => r.next_due === dateStr && r.status !== "overdue")
    if (items.length === 0) continue

    let label: string
    let colorClass: string
    if (i === 0)      { label = `Hoy — ${DAY_NAMES[d.getDay()]} ${d.getDate()}`;    colorClass = STATUS_CONFIG.today.sepColor }
    else if (i === 1) { label = `Mañana — ${DAY_NAMES[d.getDay()]} ${d.getDate()}`; colorClass = STATUS_CONFIG.tomorrow.sepColor }
    else              { label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;           colorClass = STATUS_CONFIG.upcoming.sepColor }

    thisWeekGroups.push({ key: dateStr, label, colorClass, items })
  }

  const result: DayGroup[] = []
  if (overdue.length > 0) {
    result.push({ key: "overdue", label: `Vencido${overdue.length > 1 ? "s" : ""}`, colorClass: STATUS_CONFIG.overdue.sepColor, items: overdue })
  }
  return [...result, ...thisWeekGroups]
}

// ─── Widget principal ─────────────────────────────────────────────────────────
interface Props {
  reminders: ReminderWithStatus[]
}

export function RemindersWidget({ reminders }: Props) {
  log("Render", { count: reminders.length })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sunday = new Date(today)
  sunday.setDate(today.getDate() + (7 - today.getDay()))
  const sundayStr = sunday.toISOString().split("T")[0]

  const weekReminders = reminders.filter(r =>
    r.status === "overdue" || r.next_due <= sundayStr
  )

  const groups = buildWeekGroups(weekReminders)
  const urgent = reminders.filter(r => r.status === "overdue" || r.status === "today").length

  type Item = { type: "sep"; group: DayGroup } | { type: "rem"; r: ReminderWithStatus }
  const allItems: Item[] = []
  groups.forEach(g => {
    allItems.push({ type: "sep", group: g })
    g.items.forEach(r => allItems.push({ type: "rem", r }))
  })

  const half = Math.ceil(allItems.length / 2)
  const col1 = allItems.slice(0, half)
  const col2 = allItems.slice(half)

  function renderItems(items: Item[]) {
    return items.map((item) => {
      if (item.type === "sep") {
        return <DaySeparator key={`sep-${item.group.key}`} label={item.group.label} colorClass={item.group.colorClass} />
      }
      return <ReminderRow key={item.r.id} r={item.r} />
    })
  }

  return (
    <>
      {/* ── Popup emergente para hoy/vencidos ── */}
      <TodayRemindersPopup reminders={reminders} />

      {/* ── Card del widget en el dashboard ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Recordatorios de la semana</CardTitle>
              {urgent > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E85D04] text-white text-[10px] font-semibold">
                  {urgent}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/reminders" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
              <Link href="/reminders" className="inline-flex items-center gap-1.5 rounded-lg bg-[#E85D04] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity">
                <Plus className="h-3 w-3" />
                Nuevo
              </Link>
            </div>
          </div>
          <CardDescription className="text-xs">
            Pedidos y compras ordenados por fecha · esta semana
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-1">
          {weekReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Sin recordatorios esta semana</p>
              <Link href="/reminders" className="mt-2 text-xs text-[#E85D04] hover:underline">
                Crear un recordatorio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <div>{renderItems(col1)}</div>
              {col2.length > 0 && <div>{renderItems(col2)}</div>}
            </div>
          )}

          {reminders.length > weekReminders.length && (
            <Link href="/reminders" className="flex items-center justify-center gap-1 mt-3 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {reminders.length - weekReminders.length} recordatorios más · próximas semanas
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </CardContent>
      </Card>
    </>
  )
}
