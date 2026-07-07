"use client"

import { format, parse } from "date-fns"
import { es } from "date-fns/locale"

export function formatMonthLabel(monthStr: string): string {
  const d = parse(monthStr, "yyyy-MM", new Date())
  const label = format(d, "MMMM yyyy", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface Props {
  value: string
  months: string[]   // "yyyy-MM", cualquier orden — solo meses con ventas registradas
  onChange: (value: string) => void
  disabled?: boolean
  accent?: boolean
}

export function MonthSelect({ value, months, onChange, disabled, accent }: Props) {
  // Más reciente primero
  const options = [...months].sort().reverse()

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
      {options.map((month) => (
        <option key={month} value={month}>
          {formatMonthLabel(month)}
        </option>
      ))}
    </select>
  )
}
