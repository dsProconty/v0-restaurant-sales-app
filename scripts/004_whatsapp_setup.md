# 📱 Configuración WhatsApp + Gemini Vision

> **Última actualización:** 2026-05-08
> **Estado:** Funcional en producción

---

## 🎯 Qué hace

El sistema permite registrar gastos enviando una foto de la factura por WhatsApp:

1. Usuario envía foto al número del Sandbox de Twilio (`+1 415 523 8886`)
2. Twilio reenvía la imagen al webhook `/api/whatsapp/webhook`
3. El webhook descarga la imagen y la manda a **Gemini 2.5 Flash Vision**
4. Gemini extrae: fecha, proveedor, monto, descripción y categoría
5. El sistema:
   - Hace match contra **proveedores existentes** (fuzzy match por nombre normalizado). Si no existe, lo crea automáticamente.
   - Hace match contra **categorías existentes**. Si no coincide ninguna, queda sin asignar.
   - Inserta el gasto con `source = 'whatsapp'`
6. Responde por WhatsApp confirmando los datos extraídos

---

## ⚙️ Stack técnico

| Componente | Detalle |
|---|---|
| **Modelo Gemini** | `gemini-2.5-flash` (visión multimodal) |
| **SDK** | `@google/generative-ai` |
| **Provider WhatsApp** | Twilio Sandbox |
| **Validación firma Twilio** | Desactivada temporalmente — re-habilitar con env `NEXT_PUBLIC_APP_URL` correcta |
| **Tabla destino** | `expenses` con columna `source` (`'web'` ó `'whatsapp'`) |

---

## 🔑 Variables de entorno (Vercel + .env.local)

```bash
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google Gemini
GEMINI_API_KEY=AIza...

# App URL (para validación de firma Twilio cuando se reactive)
NEXT_PUBLIC_APP_URL=https://v0-restaurant-sales-app-peach.vercel.app
```

---

## 🌐 Configuración del webhook en Twilio

**Ruta:** Twilio → Messaging → Try it out → Send a WhatsApp message → **Sandbox settings**

| Campo | Valor |
|---|---|
| When a message comes in | `https://v0-restaurant-sales-app-peach.vercel.app/api/whatsapp/webhook` |
| Method | `HTTP POST` |

---

## 🗄️ Migración SQL requerida

**Antes del primer deploy con WhatsApp**, correr en Supabase SQL Editor:

```sql
-- scripts/005_expense_source.sql
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web';

UPDATE expenses
   SET source = 'whatsapp'
 WHERE source = 'web'
   AND notes ILIKE '%vía WhatsApp%';

CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);
```

---

## 📦 Archivos clave

| Archivo | Propósito |
|---|---|
| `lib/gemini.ts` | Función `analyzeInvoiceImage` — recibe imagen base64 + listas de categorías/proveedores |
| `app/api/whatsapp/webhook/route.ts` | Webhook POST que recibe Twilio, llama a Gemini, hace match y guarda |
| `scripts/005_expense_source.sql` | Migración para columna `source` |
| `components/expenses/expense-list.tsx` | Muestra badge "📱 WhatsApp" para gastos vía móvil |

---

## 🧪 Cómo probarlo

1. Unirse al sandbox: enviar `join [código]` al `+1 415 523 8886` desde WhatsApp
2. Enviar una foto de factura
3. Verificar respuesta automática:
   - ✅ Gasto registrado → con datos extraídos
   - ❌ Error → con detalle del fallo (quota, formato, JSON inválido, etc.)
4. Revisar en `/expenses` que aparezca el gasto con badge verde 📱 WhatsApp

---

## 🐛 Troubleshooting

### Error "models/gemini-X is not found"
El modelo fue deprecado por Google. Actualizar el nombre del modelo en `lib/gemini.ts`:
```ts
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
```
Modelos vigentes con visión: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`.

### Error "GEMINI_API_KEY no está configurada"
Falta la variable en Vercel → Settings → Environment Variables → Production.

### Error "Gemini no devolvió JSON"
El modelo devolvió texto en lugar de JSON. Suele resolverse reintentando con foto más clara, o ajustando el prompt en `lib/gemini.ts`.

### Webhook responde pero no registra el gasto
Revisar que la columna `source` exista en `expenses`. Correr `005_expense_source.sql`.

### Twilio devuelve 403 Forbidden
La validación de firma está activa pero `NEXT_PUBLIC_APP_URL` no coincide con la URL pública. Está desactivada por defecto en este proyecto.

---

## 🔮 Mejoras futuras

- Reactivar validación de firma Twilio cuando `NEXT_PUBLIC_APP_URL` sea estable
- Soportar múltiples imágenes en el mismo mensaje (`NumMedia > 1`)
- Permitir editar el gasto vía WhatsApp respondiendo "editar fecha 2026-05-01"
- Cambiar de Sandbox a número productivo de WhatsApp Business
- Registrar los logs raw de Gemini en una tabla para auditoría
