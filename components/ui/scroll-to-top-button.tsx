"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

const SHOW_AFTER_PX = 300

/**
 * Botón flotante "volver arriba". Solo aparece tras bajar lo suficiente.
 */
export function ScrollToTopButton({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Subir al inicio"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed z-40 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200",
        visible ? "opacity-90 scale-100 pointer-events-auto hover:opacity-100" : "opacity-0 scale-75 pointer-events-none",
        className
      )}
    >
      <ArrowUp className="h-3.5 w-3.5" />
    </button>
  )
}
