# 🍽️ v0-restaurant-sales-app

Sistema web de **gestión de ventas diarias para restaurantes**. El operador ingresa las ventas del día, el sistema las registra y genera reportes / KPIs. No es un POS completo — es un tracker de ventas orientado a toma de decisiones.

- **Producción:** https://v0-restaurant-sales-app-peach.vercel.app
- **Repositorio:** https://github.com/dsProconty/v0-restaurant-sales-app
- **Branch principal:** `main`

---

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Estilos | Tailwind CSS |
| Componentes UI | Radix UI |
| Gráficas | Recharts |
| Notificaciones | Sonner |
| Deploy | Vercel (auto-deploy en push a `main`) |

---

## 📁 Estructura

```
/app
  /dashboard     → KPIs y métricas principales
  /history       → Historial de ventas
  /reports       → Reportes y analytics
  /sales         → Ingreso de ventas del día
  /api
    /reports     → API route de reportes
/components      → Componentes reutilizables
  /ui            → Componentes base (Radix)
/hooks           → Custom hooks
/lib
  /supabase.ts   → Cliente Supabase
  /utils.ts      → Utilidades generales
/scripts         → Scripts auxiliares
/styles          → Estilos globales
```

---

## 🚀 Setup local

```bash
git clone https://github.com/dsProconty/v0-restaurant-sales-app.git
cd v0-restaurant-sales-app
npm install
cp .env.example .env.local
# Completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

---

## 🎨 Design System

- **Color primario:** `#E85D04` (naranja)
- **Fuente principal:** DM Sans
- **Fuente monoespaciada:** DM Mono
- **Touch target mínimo:** 44px
- **Grid productos:** 3 col desktop / 2 col tablet / 1 col mobile

---

## 🗄️ Base de datos (Supabase)

Tablas principales: `daily_sales`, `sales_items`, `products`, `categories`.

Credenciales: Supabase Dashboard → Settings → API

---

## 📋 Convenciones de commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
ux:       cambio de diseño/experiencia
refactor: sin cambio funcional
docs:     solo documentación
chore:    configuración, dependencias
```

---

*Ver `CONTEXT_CLAUDE_CODE.md` para documentación extendida de uso con Claude Code.*
