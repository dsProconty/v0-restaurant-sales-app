-- Módulo CXC (Cuentas por Cobrar)
-- Clientes con crédito, deudas (consumos fiados), items consumidos y abonos/pagos

CREATE TABLE IF NOT EXISTS cxc_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cxc_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cxc_clients(id) ON DELETE CASCADE,
  consumption_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cxc_debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES cxc_debts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cxc_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES cxc_debts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE cxc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cxc_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cxc_debt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cxc_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on cxc_clients"   ON cxc_clients;
DROP POLICY IF EXISTS "Allow public insert on cxc_clients" ON cxc_clients;
DROP POLICY IF EXISTS "Allow public update on cxc_clients" ON cxc_clients;
DROP POLICY IF EXISTS "Allow public delete on cxc_clients" ON cxc_clients;
CREATE POLICY "Allow public read on cxc_clients"   ON cxc_clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cxc_clients" ON cxc_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cxc_clients" ON cxc_clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cxc_clients" ON cxc_clients FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on cxc_debts"   ON cxc_debts;
DROP POLICY IF EXISTS "Allow public insert on cxc_debts" ON cxc_debts;
DROP POLICY IF EXISTS "Allow public update on cxc_debts" ON cxc_debts;
DROP POLICY IF EXISTS "Allow public delete on cxc_debts" ON cxc_debts;
CREATE POLICY "Allow public read on cxc_debts"   ON cxc_debts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cxc_debts" ON cxc_debts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cxc_debts" ON cxc_debts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cxc_debts" ON cxc_debts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on cxc_debt_items"   ON cxc_debt_items;
DROP POLICY IF EXISTS "Allow public insert on cxc_debt_items" ON cxc_debt_items;
DROP POLICY IF EXISTS "Allow public update on cxc_debt_items" ON cxc_debt_items;
DROP POLICY IF EXISTS "Allow public delete on cxc_debt_items" ON cxc_debt_items;
CREATE POLICY "Allow public read on cxc_debt_items"   ON cxc_debt_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cxc_debt_items" ON cxc_debt_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cxc_debt_items" ON cxc_debt_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cxc_debt_items" ON cxc_debt_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on cxc_payments"   ON cxc_payments;
DROP POLICY IF EXISTS "Allow public insert on cxc_payments" ON cxc_payments;
DROP POLICY IF EXISTS "Allow public update on cxc_payments" ON cxc_payments;
DROP POLICY IF EXISTS "Allow public delete on cxc_payments" ON cxc_payments;
CREATE POLICY "Allow public read on cxc_payments"   ON cxc_payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cxc_payments" ON cxc_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cxc_payments" ON cxc_payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cxc_payments" ON cxc_payments FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_cxc_clients_name        ON cxc_clients(name);
CREATE INDEX IF NOT EXISTS idx_cxc_clients_is_active   ON cxc_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_cxc_debts_client        ON cxc_debts(client_id);
CREATE INDEX IF NOT EXISTS idx_cxc_debts_due_date      ON cxc_debts(due_date);
CREATE INDEX IF NOT EXISTS idx_cxc_debt_items_debt     ON cxc_debt_items(debt_id);
CREATE INDEX IF NOT EXISTS idx_cxc_payments_debt       ON cxc_payments(debt_id);
