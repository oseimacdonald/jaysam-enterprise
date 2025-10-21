-- Jaysam Enterprise - COMPLETE FRESH START
-- This will delete everything and recreate from scratch

-- 1. FIRST DROP ALL TABLES (in correct order due to foreign keys)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. DROP EXISTING ENUM TYPES
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- 3. CREATE FRESH ENUM TYPES
CREATE TYPE user_role AS ENUM ('Client', 'Employee', 'Admin', 'Manager', 'CEO');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');

-- 4. CREATE ALL TABLES FRESH
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_firstname VARCHAR NOT NULL,
  user_lastname VARCHAR NOT NULL,
  user_email VARCHAR UNIQUE NOT NULL,
  user_password VARCHAR NOT NULL,
  user_role user_role DEFAULT 'Client',
  created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  company_name VARCHAR NOT NULL,
  contact_person VARCHAR NOT NULL,
  contact_email VARCHAR NOT NULL,
  contact_phone VARCHAR,
  address TEXT,
  tax_number VARCHAR,
  payment_terms VARCHAR DEFAULT 'Net 30',
  credit_limit NUMERIC(15,2) DEFAULT 0,
  created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR NOT NULL,
  timber_type VARCHAR NOT NULL,
  product_grade VARCHAR NOT NULL,
  dimensions VARCHAR NOT NULL,
  length NUMERIC(10,2) NOT NULL,
  width NUMERIC(10,2) NOT NULL,
  thickness NUMERIC(10,2) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL, -- Increased precision for Ghana Cedis
  unit VARCHAR DEFAULT 'cubic_meter',
  quantity_in_stock NUMERIC(10,2) NOT NULL,
  product_description TEXT,
  product_image VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  order_number VARCHAR UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  order_status order_status DEFAULT 'Pending',
  total_amount NUMERIC(15,2) NOT NULL,
  order_notes TEXT,
  created_by INT NOT NULL,
  created_date TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
);

CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL, -- Increased precision for Ghana Cedis
  total_price NUMERIC(15,2) NOT NULL, -- Increased precision for Ghana Cedis
  item_notes TEXT,
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- 5. INSERT FRESH SAMPLE DATA WITH GHANA CEDIS PRICES
INSERT INTO users (user_firstname, user_lastname, user_email, user_password, user_role) VALUES
  ('System', 'Administrator', 'admin@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Admin'),
  ('John', 'Manager', 'manager@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Manager'),
  ('Sarah', 'Employee', 'employee@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Employee'),
  ('Customer', 'User', 'customer@example.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Client');

INSERT INTO customers (company_name, contact_person, contact_email, contact_phone, address, tax_number, credit_limit) VALUES
  ('Fine Furniture Ltd', 'Robert Brown', 'robert@finefurniture.com', '+233244567890', '123 Industrial Area, Accra', 'TAX001', 50000.00),
  ('BuildRight Constructions', 'Sarah Johnson', 'sarah@buildright.com', '+233278765432', '456 Construction Zone, Kumasi', 'TAX002', 75000.00),
  ('Wood Crafts Co', 'Michael Chen', 'michael@woodcrafts.com', '+233262233445', '789 Artisan Street, Takoradi', 'TAX003', 25000.00);

INSERT INTO products (product_name, timber_type, product_grade, dimensions, length, width, thickness, price_per_unit, quantity_in_stock, product_description) VALUES
  ('Teak Wood Planks', 'Teak', 'A', '100x50mm', 2.4, 0.1, 0.05, 12500.00, 25.5, 'Premium quality teak wood planks for furniture making'),
  ('Oak Beams', 'Oak', 'B', '150x150mm', 3.0, 0.15, 0.15, 9500.00, 18.2, 'Strong oak beams for construction and structural work'),
  ('Pine Boards', 'Pine', 'C', '50x25mm', 2.4, 0.05, 0.025, 4700.00, 45.8, 'Standard pine boards for general carpentry and DIY projects'),
  ('Mahogany Logs', 'Mahogany', 'A', 'Various', 4.0, 0.3, 0.3, 17600.00, 12.3, 'Luxury mahogany logs for high-end furniture and decorative pieces'),
  ('Cedar Planks', 'Cedar', 'B', '75x25mm', 2.4, 0.075, 0.025, 6600.00, 30.0, 'Aromatic cedar planks for closets, chests, and outdoor projects');

-- 6. CREATE INDEXES
CREATE INDEX idx_products_timber_type ON products(timber_type);
CREATE INDEX idx_products_grade ON products(product_grade);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 7. VERIFICATION QUERIES
SELECT '=== DATABASE CREATION COMPLETE ===' as status;

SELECT 'Users:' as table_name;
SELECT user_id, user_email, user_role FROM users;

SELECT 'Products (GHS):' as table_name;
SELECT product_id, product_name, timber_type, price_per_unit, quantity_in_stock FROM products;

SELECT 'Customers:' as table_name;
SELECT customer_id, company_name, contact_person, credit_limit FROM customers;

SELECT '=== SUMMARY ===' as summary;
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM customers) as total_customers;