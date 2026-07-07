"use client"

import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"

// ─── Opciones: últimos 24 meses calendario ──────────────────────────────────
export function getMonthOptions(count = 24): { value: string; label: string }[] {
  const today = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = subMonths(today, i)
    const label = format(d, "MMMM yyyy", { locale: es })
    options.push({
      value: format(d, "yyyy-MM"),
      label: label.charAt(0).toUpperCase() + label.slice(1),
    })
  }
  return options
}

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  accent?: boolean
}

export function MonthSelect({ value, onChange, disabled, accent }: Props) {
  const options = getMonthOptions()

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "rounded-lg border bg-card px-2.5 py-1.5 text-sm font-semibold disabled:opacity-50",
        accent ? "border-[#E85D04]/40 text-[#E85D04]" : "border-border text-foreground",
      ].join(" ")}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
