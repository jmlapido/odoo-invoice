-- Migration to add shipping addresses
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'United Arab Emirates',
  created_at timestamptz DEFAULT now()
);

-- Add shipping_address_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_address_id uuid REFERENCES shipping_addresses(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON shipping_addresses FOR ALL USING (true) WITH CHECK (true);
