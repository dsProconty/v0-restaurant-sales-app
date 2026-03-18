"use client"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[DateRangeSelector]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")

// ─── Types ───────────────────────────────────────────────────────────────────
export type DateRange = "hoy" | "semana" | "mes"

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "hoy",    label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes",    label: "Este mes" },
]

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  active: DateRange
  onChange: (range: DateRange) => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function DateRangeSelector({ active, onChange }: Props) {
  log("Render", { active })

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => {
            log("Range seleccionado", opt.value)
            onChange(opt.value)
          }}
          className={[
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
            active === opt.value
              ? "bg-[#E85D04] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
