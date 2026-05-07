# Configuración: Escaneo de Facturas por WhatsApp

## Flujo
```
WhatsApp → Twilio → /api/whatsapp/webhook → Gemini 1.5 Flash → Supabase
```

1. El usuario envía foto de factura por WhatsApp al número de Twilio
2. Twilio hace POST al webhook de la app
3. Se descarga la imagen y se envía a Gemini 1.5 Flash
4. Gemini extrae: fecha, proveedor, monto total, descripción
5. Se crea el gasto en Supabase automáticamente
6. Se responde al usuario con los datos registrados

---

## 1. Obtener API Key de Gemini (GRATIS)

1. Ir a https://aistudio.google.com/apikey
2. Crear una API Key
3. Agregar a `.env.local`:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```

**Límites gratuitos:** 15 req/min · 1,500 req/día · 1M tokens/día

---

## 2. Configurar Twilio WhatsApp (GRATIS con $15 crédito inicial)

### Crear cuenta
1. Ir a https://www.twilio.com/try-twilio
2. Crear cuenta → verificar email y teléfono
3. En el Dashboard copiar:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`

### Activar WhatsApp Sandbox
1. En Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Sigue las instrucciones para unirte al sandbox (enviar código por WhatsApp)
3. En **Sandbox Settings** configurar el webhook:
   - **When a message comes in:** `https://tu-app.vercel.app/api/whatsapp/webhook`
   - Método: `HTTP POST`
4. Agregar a `.env.local`:
   ```
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   ```

---

## 3. Variables de entorno en Vercel

En Vercel → Settings → Environment Variables agregar:
```
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

---

## 4. Probar

1. Desde tu WhatsApp, enviar una foto de factura al número del sandbox
2. Recibirás confirmación con los datos detectados
3. El gasto aparecerá en `/expenses`

---

## Escalabilidad futura (multi-restaurante)

Para comercializar el producto a otros restaurantes:
1. Agregar tabla `restaurants` en Supabase
2. Cada restaurante tiene su propio número de Twilio
3. El webhook identifica el restaurante por el campo `To` del mensaje
4. Todos los gastos se asocian al `restaurant_id` correspondiente

El código del webhook ya recibe `body.To` (número al que llegó el mensaje),
listo para agregar el lookup de restaurante cuando sea necesario.
