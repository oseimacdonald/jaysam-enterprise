-- Jaysam Enterprise - UPDATED FOR SIZE VARIANTS & FUTURE EXPANSION
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
DROP TYPE IF EXISTS product_category CASCADE;

-- 3. CREATE FRESH ENUM TYPES
CREATE TYPE user_role AS ENUM ('Client', 'Employee', 'Admin', 'Manager', 'CEO');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE product_category AS ENUM ('Timber', 'Plywood', 'Hardware', 'Paints', 'Building Materials');

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
  product_category product_category DEFAULT 'Timber',
  product_grade VARCHAR NOT NULL,
  dimensions VARCHAR NOT NULL,
  length NUMERIC(10,2) NOT NULL,
  width NUMERIC(10,2) NOT NULL,
  thickness NUMERIC(10,2) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL,
  unit VARCHAR DEFAULT 'piece',
  quantity_in_stock NUMERIC(10,2) NOT NULL,
  product_description TEXT,
  product_image VARCHAR,
  is_featured BOOLEAN DEFAULT FALSE,
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
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) NOT NULL,
  item_notes TEXT,
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Add this to your database schema file
CREATE TABLE cart (
  cart_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_date TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_product_id ON cart(product_id);

-- CORRECTED PRODUCTS SECTION WITH PROPER THICKNESS x WIDTH x LENGTH ORDER
INSERT INTO products (product_name, timber_type, product_category, product_grade, dimensions, thickness, width, length, price_per_unit, quantity_in_stock, product_description, product_image, is_featured) VALUES
  -- WAWA PRODUCTS (thickness x width x length)
  ('Wawa Lumber', 'Wawa', 'Timber', 'A', '2x4x16', 2, 4, 16, 45.00, 100, 'Premium Wawa lumber for construction and furniture', '/images/wawa.webp', TRUE),
  ('Wawa Lumber', 'Wawa', 'Timber', 'A', '1x12x16', 1, 12, 16, 85.00, 75, 'Wide Wawa boards for paneling and shelves', '/images/wawa.webp', FALSE),
  
  -- DAHOMA PRODUCTS
  ('Dahoma Lumber', 'Dahoma', 'Timber', 'A', '2x6x16', 2, 6, 16, 65.00, 60, 'Durable Dahoma wood for heavy construction', '/images/dahoma.webp', TRUE),
  
  -- ESSAH PRODUCTS
  ('Essah Lumber', 'Essah', 'Timber', 'A', '2x16x16', 2, 16, 16, 120.00, 40, 'Strong Essah timber for structural beams', '/images/essah.webp', FALSE),
  
  -- PLYWOOD PRODUCTS (thickness x width x length)
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/2x4x8', 0.5, 4, 8, 85.00, 200, 'Standard plywood sheet 1/2 inch thickness', '/images/plywood.webp', TRUE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/4x4x8', 0.25, 4, 8, 45.00, 150, 'Thin plywood sheet for interior work', '/images/plywood.webp', FALSE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '3/8x4x8', 0.375, 4, 8, 65.00, 180, 'Medium plywood sheet 3/8 inch thickness', '/images/plywood.webp', FALSE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/8x4x8', 0.125, 4, 8, 35.00, 120, 'Ultra-thin plywood for crafts', '/images/plywood.webp', FALSE),
  
  -- PLYWOOD PRODUCTS (4x10 sheets)
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/2x4x10', 0.5, 4, 10, 105.00, 100, 'Large plywood sheet 1/2 inch thickness', '/images/plywood.webp', FALSE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/4x4x10', 0.25, 4, 10, 55.00, 80, 'Large thin plywood sheet', '/images/plywood.webp', FALSE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '3/8x4x10', 0.375, 4, 10, 80.00, 90, 'Large medium plywood sheet', '/images/plywood.webp', FALSE),
  ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/8x4x10', 0.125, 4, 10, 45.00, 70, 'Large ultra-thin plywood sheet', '/images/plywood.webp', FALSE),
  
  -- MARINE PLYWOOD PRODUCTS
  ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '1/2x4x8', 0.5, 4, 8, 150.00, 50, 'Waterproof marine plywood 1/2 inch', '/images/marineplywood-banner.webp', TRUE),
  ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '3/4x4x8', 0.75, 4, 8, 220.00, 40, 'Thick waterproof marine plywood', '/images/marineplywood-banner.webp', FALSE),
  ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '1/2x4x10', 0.5, 4, 10, 185.00, 30, 'Large marine plywood 1/2 inch', '/images/marineplywood-banner.webp', FALSE),
  ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '3/4x4x10', 0.75, 4, 10, 275.00, 25, 'Large thick marine plywood', '/images/marineplywood-banner.webp', FALSE),
  
  -- DANYA PRODUCTS
  ('Danya Lumber', 'Danya', 'Timber', 'A', '2x6x16', 2, 6, 16, 70.00, 55, 'Quality Danya wood for furniture', '/images/danya.webp', FALSE),
  
  -- WALNUT DOUBLE BOARD
  ('Walnut Double Board', 'Walnut', 'Timber', 'Premium', '2x12x16', 2, 12, 16, 350.00, 20, 'Premium walnut for high-end furniture', '/images/walnut.webp', TRUE),
  
  -- REDWOOD DOUBLE BOARD
  ('Redwood Double Board', 'Redwood', 'Timber', 'Premium', '2x12x16', 2, 12, 16, 280.00, 25, 'Beautiful redwood for decorative work', '/images/redwood.webp', TRUE);

-- 6. CREATE ENHANCED INDEXES
CREATE INDEX idx_products_timber_type ON products(timber_type);
CREATE INDEX idx_products_category ON products(product_category);
CREATE INDEX idx_products_grade ON products(product_grade);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 7. VERIFICATION QUERIES
SELECT '=== DATABASE UPDATED FOR SIZE VARIANTS ===' as status;

SELECT 'Product Categories:' as table_name;
SELECT DISTINCT product_category, COUNT(*) as product_count 
FROM products 
GROUP BY product_category;

SELECT 'Timber Types with Sizes:' as table_name;
SELECT timber_type, dimensions, price_per_unit, quantity_in_stock 
FROM products 
WHERE product_category = 'Timber' 
ORDER BY timber_type, dimensions;

SELECT 'Plywood Products:' as table_name;
SELECT timber_type, dimensions, price_per_unit 
FROM products 
WHERE product_category = 'Plywood' 
ORDER BY timber_type, dimensions;

SELECT 'Featured Products:' as table_name;
SELECT product_id, product_name, timber_type, dimensions, price_per_unit 
FROM products 
WHERE is_featured = true;

SELECT '=== SUMMARY ===' as summary;
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(DISTINCT timber_type) FROM products) as unique_timber_types;