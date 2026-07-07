"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface ShellProps {
  children: React.ReactNode
  currentUser: { username: string; displayName: string } | null
}

export function Shell({ children, currentUser }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // /login no lleva sidebar ni topbar
  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area offset by sidebar on desktop */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} currentUser={currentUser} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
