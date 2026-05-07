-- Suppliers (Proveedores) table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on suppliers"   ON suppliers;
DROP POLICY IF EXISTS "Allow public insert on suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public update on suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public delete on suppliers" ON suppliers;

CREATE POLICY "Allow public read on suppliers"   ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on suppliers" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on suppliers" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on suppliers" ON suppliers FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_suppliers_name      ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
