# 🍽️ v0-restaurant-sales-app — Contexto para Claude Code

> Documento de referencia para trabajar el proyecto directamente desde **Claude Code**.
> Última actualización: 2026-05-06

---

## 📌 Resumen del proyecto

Sistema web de **gestión de ventas diarias para restaurantes**. El flujo core es simple: el operador ingresa las ventas del día, el sistema las registra y genera reportes / KPIs. No es un POS completo — es un tracker de ventas orientado a toma de decisiones.

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | `v0-restaurant-sales-app` |
| **Producción** | https://v0-restaurant-sales-app-peach.vercel.app |
| **Repositorio** | https://github.com/dsProconty/v0-restaurant-sales-app |
| **Branch principal** | `main` |
| **Owner GitHub** | `dsProconty` |
| **Email** | diego.sanchez@proconty.com |

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js (App Router) |
| **Lenguaje** | TypeScript |
| **Base de datos** | Supabase (PostgreSQL) |
| **Estilos** | Tailwind CSS |
| **Componentes UI** | Radix UI |
| **Gráficas** | Recharts |
| **Notificaciones** | Sonner (toasts) |
| **Bundler** | Turbopack |
| **Runtime** | Node.js (Vercel) |

---

## ☁️ Infraestructura Vercel

| Campo | Valor |
|---|---|
| **Team ID** | `team_LPv8Ud7NWwv7u61piEor8aKM` |
| **Project ID** | `prj_XWLcY9n1W4JlY1JmcHnCfSqoHLQM` |
| **Project slug** | `v0-restaurant-sales-app` |
| **Deploy automático** | Sí — cualquier push a `main` despliega en ~30s |
| **Branch alias** | `v0-restaurant-sales-app-git-main-dsprocontys-projects.vercel.app` |

### Cómo verificar el estado de un deploy (desde Claude Code)

```bash
# Ver el último deployment vía Vercel MCP
# teamId: team_LPv8Ud7NWwv7u61piEor8aKM
# projectId: prj_XWLcY9n1W4JlY1JmcHnCfSqoHLQM
```

> ⚠️ Las herramientas de **runtime logs** y **build logs** del MCP de Vercel fallan en este proyecto. Usar siempre `list_deployments` para verificar estado.

---

## 🗂️ Historial de deployments (20 más recientes)

| # | Fecha | Commit message | SHA (corto) | Estado |
|---|---|---|---|---|
| 1 | 2026-05-17 | fix popup | `91e5c03` | ✅ PROD |
| 2 | 2026-05-17 | PopUp warning | `009bd6c` | ✅ PROD |
| 3 | 2026-05-17 | recordatorios | `47c4cd0` | ✅ PROD |
| 4 | 2026-05-17 | kpi int (interactivo) | `9a76844` | ✅ PROD |
| 5 | 2026-05-17 | kpi new | `4ac34e2` | ✅ PROD |
| 6 | 2026-05-17 | KPI / Reports | `b5f0ee0` | ✅ PROD |
| 7 | 2026-05-10 | grid ventas | `472016d` | ✅ PROD |
| 8 | 2026-05-10 | sales botón | `c45c68f` | ✅ PROD |
| 9 | 2026-05-10 | frontend ventas nuevas / fix plus | `480056d` | ✅ PROD |
| 10 | 2026-05-10 | diseño ventas (nuevo diseño) | `32c7a78` | ✅ PROD |
| 11 | 2026-05-09 | Actualizar ventas (nuevo flujo) | `603ab70` | ✅ PROD |
| 12 | 2026-05-09 | ux | `69d58b4` | ✅ PROD |
| 13 | 2026-05-09 | pages.tsx history / reports / dashboard | `f5c5ab2` | ✅ PROD |
| 14 | 2026-05-09 | Update page.tsx | `662359b` | ✅ PROD |
| 15 | 2026-05-09 | Update page.tsx | `240642b` | ✅ PROD |
| 16 | 2026-05-09 | Update page.tsx | `3148c50` | ✅ PROD |
| 17 | 2026-05-09 | FIX page ID sale | `31d99d4` | ✅ PROD |
| 18 | 2026-05-09 | Update sales-entry-form.tsx / fix component | `e4c238f` | ✅ PROD |
| 19 | 2026-05-09 | GIT1 — Initial commit | `bc14ab3` | ✅ PROD |
| 20 | 2026-05-09 | v0 redeploy (origen en v0.dev) | `—` | ✅ PROD |

---

## 🎨 Design System

| Token | Valor |
|---|---|
| **Color primario** | `#E85D04` (naranja) |
| **Fuente principal** | DM Sans |
| **Fuente monoespaciada** | DM Mono |
| **Touch target mínimo** | 44px |
| **Grid productos (desktop)** | 3 columnas |
| **Grid productos (tablet)** | 2 columnas |
| **Grid productos (mobile)** | 1 columna |

### Componentes clave implementados

- Sticky category navigation tabs con smooth scroll
- Responsive product grid (3/2/1 col)
- Sticky summary sidebar en desktop
- Floating bottom bar en mobile
- Editable quantity inputs con botones +/−
- Collapsible category sections
- Normalización de títulos de categorías

---

## 🐛 Bugs conocidos y fixes aplicados

### Bug: Botón `+` clipeado en grid de 3 columnas
**Causa:** El input de cantidad no cedía espacio a los botones en layouts compactos.

**Fix aplicado:**
```tsx
// Botones: reducir dimensiones
className="h-8 w-8"

// Input: ceder espacio con flex
className="w-0 min-w-0 flex-1"

// Contenedor: reducir gap
className="gap-1"
```

---

## 🔄 Workflow de desarrollo (ANTES de Claude Code)

```
1. Editar archivo en GitHub web editor o GitHub Desktop
2. Commit a `main`
3. Vercel auto-despliega en ~30 segundos
4. Verificar con list_deployments
```

> Claude no tenía acceso de escritura al repo → entregaba ZIPs en `/mnt/user-data/outputs/` para upload manual.

---

## ⚡ Workflow con Claude Code (NUEVO)

```bash
# 1. Clonar el repo
git clone https://github.com/dsProconty/v0-restaurant-sales-app.git
cd v0-restaurant-sales-app

# 2. Instalar dependencias
npm install

# 3. Variables de entorno (necesarias para Supabase)
cp .env.example .env.local
# Completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Correr en local
npm run dev

# 5. Hacer cambios y commitear
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# → Vercel despliega automáticamente
```

---

## 📋 Reglas de desarrollo (siempre aplicar)

### Logging
Todo código nuevo debe incluir logs para manejo de errores:

```typescript
// ✅ Correcto — server actions / API routes
console.log('[NombreModulo] Iniciando operación:', { params })
console.error('[NombreModulo] Error en operación:', error)

// ✅ Correcto — cliente (componentes)
console.log('[ComponentName] State update:', { value })
console.error('[ComponentName] Failed to fetch:', error)
```

### Convenciones de commits

```
feat: nueva funcionalidad
fix: corrección de bug
ux: cambio de diseño/experiencia
refactor: refactorización sin cambio funcional
docs: solo documentación
chore: configuración, dependencias
```

### Estructura de archivos

```
/app
  /dashboard        → KPIs y métricas principales
  /history          → Historial de ventas
  /reports          → Reportes y analytics
  /sales            → Ingreso de ventas del día
/components         → Componentes reutilizables
  /ui               → Componentes base (Radix)
/lib
  /supabase.ts      → Cliente Supabase
  /utils.ts         → Utilidades generales
```

---

## 🗄️ Supabase

- Proyecto conectado vía variables de entorno
- Cliente inicializado en `/lib/supabase.ts`
- Las tablas principales giran alrededor de `sales` / `products` / `categories`

> Para obtener credenciales: Supabase Dashboard → Settings → API

---

## 🚀 Comandos útiles en Claude Code

```bash
# Ver estado del proyecto
npm run build        # Verificar que compila sin errores
npm run lint         # Linting TypeScript/ESLint
npm run dev          # Dev server en localhost:3000

# Git
git log --oneline -10          # Ver últimos 10 commits
git diff HEAD~1                # Ver qué cambió en el último commit
git status                     # Estado del working tree

# Deploy manual (si necesario)
git push origin main           # Dispara Vercel auto-deploy
```

---

## 🔍 Cómo Claude Code debe trabajar en este proyecto

1. **Siempre leer el archivo antes de modificarlo** — nunca asumir el contenido
2. **Incluir logs** en todo código nuevo (ver sección Logging)
3. **Indicar exactamente qué archivo se modifica** con su ruta completa
4. **Hacer commits atómicos** — un cambio por commit con mensaje descriptivo
5. **Verificar el build** antes de pushear cambios importantes (`npm run build`)
6. **Confirmar el deploy** revisando `list_deployments` después del push

---

## 📞 Contexto del owner

- **Perfil:** Product Manager con conocimientos técnicos medios y background en QA
- **Objetivo:** Automatizar procesos, reducir intervención manual
- **Preferencia:** Claude Code sube los archivos directamente — no entregar ZIPs salvo que sea última opción
- **Stack de trabajo:** GitHub + Vercel (CI/CD automático)

---

*Generado automáticamente el 2026-05-06 con contexto de deployments en vivo desde Vercel MCP.*
