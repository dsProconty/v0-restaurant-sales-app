import "server-only"
import { createClient } from "@supabase/supabase-js"

// Cliente con la service role key — bypassa RLS.
// Uso exclusivo: auth (tabla `users`). Nunca importar desde un componente
// cliente ni usar para leer/escribir datos de negocio (ventas, gastos, etc.),
// que siguen pasando por lib/supabase/server.ts con la anon key.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY — requeridas para el login.",
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
