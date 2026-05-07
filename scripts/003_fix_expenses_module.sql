-- Asegura que las tablas y políticas del módulo de gastos existen.
-- Idempotente: seguro de correr múltiples veces.

-- ── expense_categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on expense_categories"   ON expense_categories;
DROP POLICY IF EXISTS "Allow public insert on expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Allow public update on expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Allow public delete on expense_categories" ON expense_categories;

CREATE POLICY "Allow public read on expense_categories"   ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on expense_categories" ON expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on expense_categories" ON expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on expense_categories" ON expense_categories FOR DELETE USING (true);

-- ── expenses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  supplier TEXT,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  amount_without_tax DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on expenses"   ON expenses;
DROP POLICY IF EXISTS "Allow public insert on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public update on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public delete on expenses" ON expenses;

CREATE POLICY "Allow public read on expenses"   ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on expenses" ON expenses FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_expenses_date        ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
