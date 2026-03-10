-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily sales table (one record per day)
CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL UNIQUE,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales items table (individual product sales for each day)
CREATE TABLE IF NOT EXISTS sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_sale_id UUID NOT NULL REFERENCES daily_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- Public access policies (this is an internal restaurant tool)
CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow public read on daily_sales" ON daily_sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert on daily_sales" ON daily_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on daily_sales" ON daily_sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on daily_sales" ON daily_sales FOR DELETE USING (true);

CREATE POLICY "Allow public read on sales_items" ON sales_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sales_items" ON sales_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sales_items" ON sales_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sales_items" ON sales_items FOR DELETE USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_items_daily_sale ON sales_items(daily_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id);
