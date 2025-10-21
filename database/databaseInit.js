const db = require('./databaseConnection')

const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking Jaysam Enterprise Database...')

    // Create ENUM types (like your account_type)
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
        product_grade VARCHAR NOT NULL,
        dimensions VARCHAR NOT NULL,
        length NUMERIC(10,2) NOT NULL,
        width NUMERIC(10,2) NOT NULL,
        thickness NUMERIC(10,2) NOT NULL,
        price_per_unit NUMERIC(15,2) NOT NULL,
        unit VARCHAR DEFAULT 'cubic_meter',
        quantity_in_stock NUMERIC(10,2) NOT NULL,
        product_description TEXT,
        product_image VARCHAR,
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT NOW()
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
      CREATE INDEX IF NOT EXISTS idx_products_grade ON products(product_grade);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `)
    
    console.log('✅ Indexes created successfully!')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
  }
}

const insertDefaultData = async () => {
  try {
    console.log('📥 Inserting default data...')

    // Insert default users
    await db.query(`
      INSERT INTO users (user_firstname, user_lastname, user_email, user_password, user_role) VALUES
      ('System', 'Administrator', 'admin@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Admin'),
      ('John', 'Manager', 'manager@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Manager'),
      ('Sarah', 'CEO', 'ceo@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'CEO'),
      ('Mike', 'Employee', 'employee@jaysamenterprise.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Employee'),
      ('Customer', 'User', 'customer@example.com', '$2a$10$8K1p/a0dRTlRMa3K6x9Lk.FUcJ/7GRa5b5pWpGyHkU9t5VdQ2J2W.', 'Client')
      ON CONFLICT (user_email) DO NOTHING
    `)

    // Insert sample customers with Ghana locations and phone numbers
    await db.query(`
      INSERT INTO customers (company_name, contact_person, contact_email, contact_phone, address, tax_number, credit_limit) VALUES
      ('Fine Furniture Ltd', 'Robert Brown', 'robert@finefurniture.com', '+233244567890', '123 Industrial Area, Accra', 'TAX001', 50000.00),
      ('BuildRight Constructions', 'Sarah Johnson', 'sarah@buildright.com', '+233278765432', '456 Construction Zone, Kumasi', 'TAX002', 75000.00),
      ('Wood Crafts Co', 'Michael Chen', 'michael@woodcrafts.com', '+233262233445', '789 Artisan Street, Takoradi', 'TAX003', 25000.00)
      ON CONFLICT (company_name) DO NOTHING
    `)

    // Insert sample products with Ghana Cedis (GHS) prices
    await db.query(`
      INSERT INTO products (product_name, timber_type, product_grade, dimensions, length, width, thickness, price_per_unit, quantity_in_stock, product_description) VALUES
      ('Teak Wood Planks', 'Teak', 'A', '100x50mm', 2.4, 0.1, 0.05, 12500.00, 25.5, 'Premium quality teak wood planks for furniture making'),
      ('Oak Beams', 'Oak', 'B', '150x150mm', 3.0, 0.15, 0.15, 9500.00, 18.2, 'Strong oak beams for construction and structural work'),
      ('Pine Boards', 'Pine', 'C', '50x25mm', 2.4, 0.05, 0.025, 4700.00, 45.8, 'Standard pine boards for general carpentry and DIY projects'),
      ('Mahogany Logs', 'Mahogany', 'A', 'Various', 4.0, 0.3, 0.3, 17600.00, 12.3, 'Luxury mahogany logs for high-end furniture and decorative pieces'),
      ('Cedar Planks', 'Cedar', 'B', '75x25mm', 2.4, 0.075, 0.025, 6600.00, 30.0, 'Aromatic cedar planks for closets, chests, and outdoor projects')
      ON CONFLICT (product_name) DO NOTHING
    `)

    console.log('✅ Default data inserted successfully!')

  } catch (error) {
    console.error('❌ Error inserting default data:', error)
  }
}

module.exports = initializeDatabase