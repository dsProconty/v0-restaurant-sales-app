"use client"

import { useTransition } from "react"
import { Bell, Menu, LogOut, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { logout } from "@/app/login/actions"

interface TopbarProps {
  onMenuClick: () => void
  currentUser: { username: string; displayName: string } | null
}

export function Topbar({ onMenuClick, currentUser }: TopbarProps) {
  const [isPending, startTransition] = useTransition()
  const initial = (currentUser?.displayName || currentUser?.username || "?").charAt(0).toUpperCase()

  function handleLogout() {
    startTransition(() => {
      logout()
    })
  }

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold select-none">
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="truncate">
              {currentUser?.displayName ?? "Usuario"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/users" className="flex items-center gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4" />
                Usuarios
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} disabled={isPending} className="flex items-center gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" />
              {isPending ? "Saliendo..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
