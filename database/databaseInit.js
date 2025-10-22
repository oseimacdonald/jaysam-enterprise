const db = require('./databaseConnection')

const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking Jaysam Enterprise Database...')

    // Create ENUM types
    await db.query(`
      DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('Client', 'Employee', 'Admin', 'Manager', 'CEO');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE product_category AS ENUM ('Timber', 'Plywood', 'Hardware', 'Paints', 'Building Materials');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `)

    // Check if tables exist and create them if they don't
    await createTableIfNotExists('users', `
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        user_firstname VARCHAR NOT NULL,
        user_lastname VARCHAR NOT NULL,
        user_email VARCHAR UNIQUE NOT NULL,
        user_password VARCHAR NOT NULL,
        user_role user_role DEFAULT 'Client',
        created_date TIMESTAMP DEFAULT NOW()
      )
    `)

    await createTableIfNotExists('customers', `
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
      )
    `)

    await createTableIfNotExists('products', `
      CREATE TABLE products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR NOT NULL,
        timber_type VARCHAR NOT NULL,
        product_category product_category DEFAULT 'Timber',
        product_grade VARCHAR NOT NULL,
        dimensions VARCHAR NOT NULL,
        thickness NUMERIC(10,2) NOT NULL,
        width NUMERIC(10,2) NOT NULL,
        length NUMERIC(10,2) NOT NULL,
        price_per_unit NUMERIC(15,2) NOT NULL,
        unit VARCHAR DEFAULT 'piece',
        quantity_in_stock NUMERIC(10,2) NOT NULL,
        product_description TEXT,
        product_image VARCHAR,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_name, timber_type, dimensions)
      )
    `)

    await createTableIfNotExists('orders', `
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
        CONSTRAINT fk_customer FOREIGN KEY (customer_id)
          REFERENCES customers (customer_id)
          ON UPDATE CASCADE
          ON DELETE NO ACTION,
        CONSTRAINT fk_created_by FOREIGN KEY (created_by)
          REFERENCES users (user_id)
          ON UPDATE CASCADE
          ON DELETE NO ACTION
      )
    `)

    await createTableIfNotExists('order_items', `
      CREATE TABLE order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        unit_price NUMERIC(15,2) NOT NULL,
        total_price NUMERIC(15,2) NOT NULL,
        item_notes TEXT,
        CONSTRAINT fk_order FOREIGN KEY (order_id)
          REFERENCES orders (order_id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        CONSTRAINT fk_product FOREIGN KEY (product_id)
          REFERENCES products (product_id)
          ON UPDATE CASCADE
          ON DELETE NO ACTION
      )
    `)

    await createTableIfNotExists('cart', `
      CREATE TABLE cart (
        cart_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        added_date TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `)

    // Insert default data
    await insertDefaultData()

    // Create indexes for performance
    await createIndexes()
    
    console.log('✅ Jaysam Enterprise Database initialized successfully!')
  } catch (error) {
    // If it's a "table already exists" error, just log it and continue
    if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist, continuing...')
    } else {
      console.error('❌ Database initialization failed:', error)
      throw error
    }
  }
}

const createTableIfNotExists = async (tableName, createQuery) => {
  try {
    // Check if table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName])

    if (!tableExists.rows[0].exists) {
      console.log(`📊 Creating ${tableName} table...`)
      await db.query(createQuery)
      console.log(`✅ ${tableName} table created successfully!`)
    } else {
      console.log(`ℹ️  ${tableName} table already exists, skipping...`)
    }
  } catch (error) {
    console.error(`❌ Error creating ${tableName} table:`, error)
    throw error
  }
}

const createIndexes = async () => {
  try {
    console.log('📈 Creating indexes...')
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_products_timber_type ON products(timber_type);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(product_category);
      CREATE INDEX IF NOT EXISTS idx_products_grade ON products(product_grade);
      CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);
    `)
    
    console.log('✅ Indexes created successfully!')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
  }
}

const insertDefaultData = async () => {
  try {
    console.log('📥 Inserting default data...')

    // Check if users already exist
    const userCount = await db.query('SELECT COUNT(*) FROM users')
    if (userCount.rows[0].count === '0') {
      // Insert default users
      await db.query(`
        INSERT INTO users (user_firstname, user_lastname, user_email, user_password, user_role) VALUES
        ('System', 'Administrator', 'admin@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Admin'),
        ('John', 'Manager', 'manager@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Manager'),
        ('Sarah', 'CEO', 'ceo@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'CEO'),
        ('Mike', 'Employee', 'employee@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Employee'),
        ('Customer', 'User', 'customer@example.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Client')
      `)
      console.log('✅ Default users inserted')
    }

    // Check if customers already exist
    const customerCount = await db.query('SELECT COUNT(*) FROM customers')
    if (customerCount.rows[0].count === '0') {
      // Insert sample customers with Ghana locations and phone numbers
      await db.query(`
        INSERT INTO customers (company_name, contact_person, contact_email, contact_phone, address, tax_number, credit_limit) VALUES
        ('Fine Furniture Ltd', 'Robert Brown', 'robert@finefurniture.com', '+233244567890', '123 Industrial Area, Accra', 'TAX001', 50000.00),
        ('BuildRight Constructions', 'Sarah Johnson', 'sarah@buildright.com', '+233278765432', '456 Construction Zone, Kumasi', 'TAX002', 75000.00),
        ('Wood Crafts Co', 'Michael Chen', 'michael@woodcrafts.com', '+233262233445', '789 Artisan Street, Takoradi', 'TAX003', 25000.00)
      `)
      console.log('✅ Default customers inserted')
    }

    // Check if products already exist
    const productCount = await db.query('SELECT COUNT(*) FROM products')
    if (productCount.rows[0].count === '0') {
      // Insert updated products with size variants - ALL IMAGES IN WEBP FORMAT
      await db.query(`
        INSERT INTO products (product_name, timber_type, product_category, product_grade, dimensions, thickness, width, length, price_per_unit, quantity_in_stock, product_description, product_image, is_featured) VALUES
        ('Wawa Lumber', 'Wawa', 'Timber', 'A', '2x4x16', 2, 4, 16, 45.00, 100, 'Premium Wawa lumber for construction and furniture', '/images/wawa.webp', TRUE),
        ('Wawa Lumber', 'Wawa', 'Timber', 'A', '1x12x16', 1, 12, 16, 85.00, 75, 'Wide Wawa boards for paneling and shelves', '/images/wawa.webp', FALSE),
        ('Dahoma Lumber', 'Dahoma', 'Timber', 'A', '2x6x16', 2, 6, 16, 65.00, 60, 'Durable Dahoma wood for heavy construction', '/images/dahoma.webp', TRUE),
        ('Essah Lumber', 'Essah', 'Timber', 'A', '2x16x16', 2, 16, 16, 120.00, 40, 'Strong Essah timber for structural beams', '/images/essah.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/2x4x8', 0.5, 4, 8, 85.00, 200, 'Standard plywood sheet 1/2 inch thickness', '/images/plywood.webp', TRUE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/4x4x8', 0.25, 4, 8, 45.00, 150, 'Thin plywood sheet for interior work', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '3/8x4x8', 0.375, 4, 8, 65.00, 180, 'Medium plywood sheet 3/8 inch thickness', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/8x4x8', 0.125, 4, 8, 35.00, 120, 'Ultra-thin plywood for crafts', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/2x4x10', 0.5, 4, 10, 105.00, 100, 'Large plywood sheet 1/2 inch thickness', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/4x4x10', 0.25, 4, 10, 55.00, 80, 'Large thin plywood sheet', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '3/8x4x10', 0.375, 4, 10, 80.00, 90, 'Large medium plywood sheet', '/images/plywood.webp', FALSE),
        ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/8x4x10', 0.125, 4, 10, 45.00, 70, 'Large ultra-thin plywood sheet', '/images/plywood.webp', FALSE),
        ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '1/2x4x8', 0.5, 4, 8, 150.00, 50, 'Waterproof marine plywood 1/2 inch', '/images/marineplywood-banner.webp', TRUE),
        ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '3/4x4x8', 0.75, 4, 8, 220.00, 40, 'Thick waterproof marine plywood', '/images/marineplywood-banner.webp', FALSE),
        ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '1/2x4x10', 0.5, 4, 10, 185.00, 30, 'Large marine plywood 1/2 inch', '/images/marineplywood-banner.webp', FALSE),
        ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '3/4x4x10', 0.75, 4, 10, 275.00, 25, 'Large thick marine plywood', '/images/marineplywood-banner.webp', FALSE),
        ('Danya Lumber', 'Danya', 'Timber', 'A', '2x6x16', 2, 6, 16, 70.00, 55, 'Quality Danya wood for furniture', '/images/danya.webp', FALSE),
        ('Walnut Double Board', 'Walnut', 'Timber', 'Premium', '2x12x16', 2, 12, 16, 350.00, 20, 'Premium walnut for high-end furniture', '/images/walnut.webp', TRUE),
        ('Redwood Double Board', 'Redwood', 'Timber', 'Premium', '2x12x16', 2, 12, 16, 280.00, 25, 'Beautiful redwood for decorative work', '/images/redwood.webp', TRUE)
      `)
      console.log('✅ Default products inserted with WebP images')
    } else {
      // Update existing products to ensure featured products exist and images are WebP
      await db.query(`
        UPDATE products SET 
          is_featured = TRUE,
          product_image = CASE 
            WHEN timber_type = 'Wawa' THEN '/images/wawa.webp'
            WHEN timber_type = 'Dahoma' THEN '/images/dahoma.webp'
            WHEN timber_type = 'Essah' THEN '/images/essah.webp'
            WHEN timber_type = 'Plywood' THEN '/images/plywood.webp'
            WHEN timber_type = 'Marine Plywood' THEN '/images/marineplywood-banner.webp'
            WHEN timber_type = 'Danya' THEN '/images/danya.webp'
            WHEN timber_type = 'Walnut' THEN '/images/walnut.webp'
            WHEN timber_type = 'Redwood' THEN '/images/redwood.webp'
            ELSE product_image
          END
        WHERE product_id IN (
          SELECT product_id FROM products 
          WHERE timber_type IN ('Wawa', 'Dahoma', 'Plywood', 'Marine Plywood', 'Walnut', 'Redwood')
          AND dimensions IN ('2x4x16', '2x6x16', '1/2x4x8', '2x12x16')
          LIMIT 6
        )
      `)
      console.log('✅ Featured products and WebP images updated')
    }

    console.log('✅ Default data insertion completed!')

  } catch (error) {
    console.error('❌ Error inserting default data:', error)
  }
}

module.exports = initializeDatabase