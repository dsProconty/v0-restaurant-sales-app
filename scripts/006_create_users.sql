-- Tabla de usuarios para el login simple (usuario + contraseña)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- RLS habilitado SIN políticas públicas a propósito: esta tabla contiene
-- password_hash y solo debe leerse/escribirse desde el servidor usando la
-- service role key (ver lib/supabase/admin.ts). Nunca agregar aquí una
-- política "Allow public..." como las de otras tablas — eso expondría los
-- hashes de contraseña a cualquiera con la anon key.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Usuario administrador por defecto — contraseña: Sanhur12345
-- Recomendado: entrar y cambiar la contraseña (o crear tu propio usuario y
-- borrar este) una vez que el login esté funcionando.
INSERT INTO users (username, password_hash, display_name)
VALUES (
  'administrador',
  '$2b$12$nCnAlG6FQGUPS53CORvsZ.v09/rJ8gU8qEJIq0T5MFPMPdWWRzBhO',
  'Administrador'
)
ON CONFLICT (username) DO NOTHING;
