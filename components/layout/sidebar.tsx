"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BarChart3,
  Receipt,
  Bell,
  Package,
  Truck,
  Tag,
  ChevronDown,
  BookOpen,
  X,
} from "lucide-react"

interface NavItemDef {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match?: (pathname: string) => boolean
}

function NavItem({ item, onClick }: { item: NavItemDef; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = item.match
    ? item.match(pathname)
    : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
      {item.label}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {label}
    </p>
  )
}

const NAV_ITEMS = {
  inicio: {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
    match: (p: string) => p === "/",
  },
  nuevaVenta: { href: "/sales/new", label: "Nueva Venta", icon: PlusCircle },
  historial: { href: "/sales/history", label: "Historial", icon: History },
  reportes: { href: "/reports", label: "Reportes", icon: BarChart3 },
  gastos: {
    href: "/expenses",
    label: "Gastos",
    icon: Receipt,
    match: (p: string) =>
      p === "/expenses" ||
      (p.startsWith("/expenses/") &&
        !p.startsWith("/expenses/categories") &&
        !p.startsWith("/expenses/suppliers")),
  },
  productos: { href: "/products", label: "Productos", icon: Package },
  categoriasGastos: { href: "/expenses/categories", label: "Categorías de Gastos", icon: Tag },
  proveedores: { href: "/expenses/suppliers", label: "Proveedores", icon: Truck },
  recordatorios: { href: "/reminders", label: "Recordatorios", icon: Bell },
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const catalogosActive =
    pathname.startsWith("/products") ||
    pathname.startsWith("/expenses/categories") ||
    pathname.startsWith("/expenses/suppliers")
  const [catalogosOpen, setCatalogosOpen] = useState(catalogosActive)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-screen w-64 flex flex-col bg-card border-r border-border",
        "transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between bg-primary px-5 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-primary-foreground leading-tight">
            Control de<br />Ventas
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground md:hidden transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 overflow-y-auto px-3 py-3 gap-0.5">

        <NavItem item={NAV_ITEMS.inicio} onClick={onClose} />

        <SectionLabel label="Ventas" />
        <NavItem item={NAV_ITEMS.nuevaVenta} onClick={onClose} />
        <NavItem item={NAV_ITEMS.historial} onClick={onClose} />
        <NavItem item={NAV_ITEMS.reportes} onClick={onClose} />

        <SectionLabel label="Gastos" />
        <NavItem item={NAV_ITEMS.gastos} onClick={onClose} />

        <SectionLabel label="Catálogos" />
        <button
          onClick={() => setCatalogosOpen((p) => !p)}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium w-full transition-all duration-200",
            catalogosActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-3">
            <BookOpen className={cn("h-4 w-4 shrink-0", catalogosActive && "text-primary")} />
            Catálogos
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              catalogosOpen && "rotate-180"
            )}
          />
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            catalogosOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pl-3 flex flex-col gap-0.5 pt-0.5">
            <NavItem item={NAV_ITEMS.productos} onClick={onClose} />
            <NavItem item={NAV_ITEMS.categoriasGastos} onClick={onClose} />
            <NavItem item={NAV_ITEMS.proveedores} onClick={onClose} />
          </div>
        </div>

        <SectionLabel label="Otros" />
        <NavItem item={NAV_ITEMS.recordatorios} onClick={onClose} />
      </nav>
    </aside>
  )
}
