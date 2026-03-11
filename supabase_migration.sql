-- ================================================
-- Silentnight Invoice Generator - Database Schema
-- Run this in Supabase SQL Editor (Dashboard)
-- ================================================

-- 1. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Silentnight UAE LLC',
  vat_number text DEFAULT '100300457700003',
  phone text DEFAULT '+971 (6) 740 7264',
  email text DEFAULT 'info@silentnight.ae',
  website text DEFAULT 'https://www.silentnight.ae/',
  address_line1 text DEFAULT 'Al Ittihad Street',
  address_line2 text DEFAULT 'PO BOX 2604',
  city text DEFAULT 'AJMAN',
  country text DEFAULT 'United Arab Emirates',
  tagline text DEFAULT 'The secret to a great nights sleep for everyone',
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  street text,
  city text,
  country text DEFAULT 'United Arab Emirates',
  vat_number text,
  created_at timestamptz DEFAULT now()
);

-- 3. BANK DETAILS
CREATE TABLE IF NOT EXISTS bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_name text NOT NULL,
  bank_name text,
  branch text,
  account_no text,
  iban text,
  swift text,
  created_at timestamptz DEFAULT now()
);

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  source text,
  po_reference text,
  beneficiary_text text,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  bank_detail_id uuid REFERENCES bank_details(id) ON DELETE SET NULL,
  discount_total numeric(12,2) DEFAULT 0,
  untaxed_amount numeric(12,2) DEFAULT 0,
  vat_amount numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. INVOICE LINES
CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric(12,3) DEFAULT 1,
  unit text DEFAULT 'Unit',
  unit_price numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  vat_percentage numeric(5,2) DEFAULT 5,
  vat_amount numeric(12,2) DEFAULT 0,
  amount numeric(12,2) DEFAULT 0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ================================================
-- ROW LEVEL SECURITY (allow all since password-gated at app level)
-- ================================================

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON bank_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON invoice_lines FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- SEED DATA
-- ================================================

-- Company settings (one row)
INSERT INTO company_settings (company_name, vat_number, phone, email, website, address_line1, address_line2, city, country, tagline)
VALUES (
  'Silentnight UAE LLC',
  '100300457700003',
  '+971 (6) 740 7264',
  'info@silentnight.ae',
  'https://www.silentnight.ae/',
  'Al Ittihad Street',
  'PO BOX 2604',
  'AJMAN',
  'United Arab Emirates',
  'The secret to a great nights sleep for everyone'
) ON CONFLICT DO NOTHING;

-- Sample customer
INSERT INTO customers (name, street, city, country, vat_number)
VALUES (
  'Sharjah City for Humanitarian Services',
  'Maliha Street',
  'Sharjah',
  'United Arab Emirates',
  '100581956800003'
);

-- Sample bank details
INSERT INTO bank_details (beneficiary_name, bank_name, branch, account_no, iban, swift)
VALUES (
  'Silentnight UAE LLC.',
  'Habib Bank AG Zurich',
  'Jebel Ali Branch',
  '02-01-09-020311-105-01151-04',
  'AE380290920311105115014',
  ''
);
