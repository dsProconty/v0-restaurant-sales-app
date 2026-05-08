-- Agrega columna source para distinguir el origen de cada gasto.
-- Idempotente: seguro de correr múltiples veces.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web';

-- Marca todos los gastos previos creados vía WhatsApp con base en notes
UPDATE expenses
   SET source = 'whatsapp'
 WHERE source = 'web'
   AND notes ILIKE '%vía WhatsApp%';

CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);
