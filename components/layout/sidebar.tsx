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
  TrendingUp,
  Users,
  X,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

interface NavItemDef {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match?: (pathname: string) => boolean
}

function NavItem({ item, onClick, collapsed }: { item: NavItemDef; onClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname()
  const isActive = item.match
    ? item.match(pathname)
    : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        collapsed && "md:justify-center md:px-2",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
      <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
    </Link>
  )
}

function SectionLabel({ label, collapsed }: { label: string; collapsed?: boolean }) {
  return (
    <>
      <p className={cn(
        "px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60",
        collapsed && "md:hidden"
      )}>
        {label}
      </p>
      {collapsed && <div className="hidden md:block mx-3 mt-4 mb-1 border-t border-border" />}
    </>
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
  kpiGerencial: { href: "/kpi-gerencial", label: "KPI Gerencial", icon: TrendingUp },
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
  cxc: {
    href: "/cxc",
    label: "Cuentas por Cobrar",
    icon: Wallet,
    match: (p: string) => p === "/cxc" || p.startsWith("/cxc/"),
  },
  productos: { href: "/products", label: "Productos", icon: Package },
  categoriasGastos: { href: "/expenses/categories", label: "Categorías de Gastos", icon: Tag },
  proveedores: { href: "/expenses/suppliers", label: "Proveedores", icon: Truck },
  recordatorios: { href: "/reminders", label: "Recordatorios", icon: Bell },
  usuarios: { href: "/users", label: "Usuarios", icon: Users },
}

interface SidebarProps {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
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
        "transition-[transform,width] duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        collapsed && "md:w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between bg-primary px-5 py-4 shrink-0">
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "md:justify-center md:w-full")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20 shrink-0">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className={cn("text-sm font-bold text-primary-foreground leading-tight whitespace-nowrap", collapsed && "md:hidden")}>
            Control de<br />Ventas
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground md:hidden transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Expandir menú" : "Contraer menú"}
        className={cn(
          "hidden md:flex items-center shrink-0 px-5 py-2 text-muted-foreground hover:text-foreground transition-colors border-b border-border",
          collapsed ? "justify-center" : "justify-end"
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      {/* Nav */}
      <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 gap-0.5">

        <NavItem item={NAV_ITEMS.inicio} onClick={onClose} collapsed={collapsed} />

        <SectionLabel label="Ventas" collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.nuevaVenta} onClick={onClose} collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.historial} onClick={onClose} collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.reportes} onClick={onClose} collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.kpiGerencial} onClick={onClose} collapsed={collapsed} />

        <SectionLabel label="Gastos" collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.gastos} onClick={onClose} collapsed={collapsed} />

        <SectionLabel label="Cuentas por Cobrar" collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.cxc} onClick={onClose} collapsed={collapsed} />

        <button
          onClick={() => setCatalogosOpen((p) => !p)}
          title={collapsed ? "Catálogos" : undefined}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 mt-4 text-sm font-medium w-full transition-all duration-200",
            collapsed && "md:justify-center md:px-2",
            catalogosActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className={cn("flex items-center gap-3", collapsed && "md:gap-0")}>
            <BookOpen className={cn("h-4 w-4 shrink-0", catalogosActive && "text-primary")} />
            <span className={cn(collapsed && "md:hidden")}>Catálogos</span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200 shrink-0",
              catalogosOpen && "rotate-180",
              collapsed && "md:hidden"
            )}
          />
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            catalogosOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className={cn("pl-3 flex flex-col gap-0.5 pt-0.5", collapsed && "md:pl-0")}>
            <NavItem item={NAV_ITEMS.productos} onClick={onClose} collapsed={collapsed} />
            <NavItem item={NAV_ITEMS.categoriasGastos} onClick={onClose} collapsed={collapsed} />
            <NavItem item={NAV_ITEMS.proveedores} onClick={onClose} collapsed={collapsed} />
          </div>
        </div>

        <SectionLabel label="Otros" collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.recordatorios} onClick={onClose} collapsed={collapsed} />
        <NavItem item={NAV_ITEMS.usuarios} onClick={onClose} collapsed={collapsed} />
      </nav>
    </aside>
  )
}
