"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 shrink-0">
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        {/* App name on mobile */}
        <span className="text-sm font-semibold text-foreground md:hidden">
          Control de Ventas
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
          <Link href="/reminders">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold select-none">
          R
        </div>
      </div>
    </header>
  )
}
