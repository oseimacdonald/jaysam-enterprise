const db = require("../database/databaseConnection")

// Get all unique timber types (for grouping products)
async function getAllTimberTypes() {
  try {
    const sql = `
      SELECT DISTINCT timber_type, product_category, 
             MIN(product_image) as product_image,
             COUNT(*) as variant_count
      FROM products 
      WHERE is_active = true 
      GROUP BY timber_type, product_category
      ORDER BY timber_type`
    const data = await db.query(sql)
    return data.rows
  } catch (error) {
    console.error("Model error getting timber types: ", error)
    return []
  }
}

// Get all size variants for a specific timber type
async function getSizeVariantsByTimberType(timber_type) {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_grade, 
             dimensions, thickness, width, length,
             price_per_unit, unit, quantity_in_stock, 
             product_description, product_image
      FROM products 
      WHERE timber_type = $1 AND is_active = true 
      ORDER BY thickness, width, length`
    const data = await db.query(sql, [timber_type])
    return data.rows
  } catch (error) {
    console.error("Model error getting size variants: ", error)
    return []
  }
}

// Get featured products for carousel/slider
async function getFeaturedProducts() {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_category,
             dimensions, thickness, width, length,
             price_per_unit, product_description, product_image
      FROM products 
      WHERE is_featured = true AND is_active = true 
      ORDER BY timber_type, dimensions
      LIMIT 8`
    const data = await db.query(sql)
    return data.rows
  } catch (error) {
    console.error("Model error getting featured products: ", error)
    return []
  }
}

// Get product by ID (for cart/order processing)
async function getProductById(product_id) {
  try {
    const sql = `
      SELECT * FROM products 
      WHERE product_id = $1 AND is_active = true`
    const data = await db.query(sql, [product_id])
    return data.rows[0]
  } catch (error) {
    console.error("Model error getting product by ID: ", error)
    return null
  }
}

// Get available dimensions for filtering
async function getAvailableDimensions() {
  try {
    const sql = `
      SELECT DISTINCT dimensions, thickness, width, length
      FROM products 
      WHERE is_active = true 
      ORDER BY thickness, width, length`
    const data = await db.query(sql)
    return data.rows
  } catch (error) {
    console.error("Model error getting dimensions: ", error)
    return []
  }
}

// Calculate price based on selected size and quantity
async function calculateProductPrice(product_id, quantity) {
  try {
    const sql = `
      SELECT price_per_unit, unit, quantity_in_stock
      FROM products 
      WHERE product_id = $1 AND is_active = true`
    const data = await db.query(sql, [product_id])
    
    if (data.rows.length === 0) {
      return { error: 'Product not found' }
    }
    
    const product = data.rows[0]
    const totalPrice = product.price_per_unit * quantity
    
    return {
      unitPrice: product.price_per_unit,
      totalPrice: totalPrice,
      unit: product.unit,
      availableStock: product.quantity_in_stock,
      canOrder: quantity <= product.quantity_in_stock
    }
  } catch (error) {
    console.error("Model error calculating price: ", error)
    return { error: 'Calculation failed' }
  }
}

// Get products by category (for future expansion - nails, paints, etc.)
async function getProductsByCategory(category) {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_category,
             dimensions, thickness, width, length,
             price_per_unit, unit, quantity_in_stock,
             product_description, product_image
      FROM products 
      WHERE product_category = $1 AND is_active = true 
      ORDER BY timber_type, dimensions`
    const data = await db.query(sql, [category])
    return data.rows
  } catch (error) {
    console.error("Model error getting products by category: ", error)
    return []
  }
}

// Search products with filters
async function searchProducts(filters = {}) {
  try {
    let sql = `
      SELECT product_id, product_name, timber_type, product_category,
             dimensions, thickness, width, length,
             price_per_unit, unit, quantity_in_stock,
             product_description, product_image
      FROM products 
      WHERE is_active = true`
    
    const params = []
    let paramCount = 0

    // Add search term filter
    if (filters.search) {
      paramCount++
      sql += ` AND (product_name ILIKE $${paramCount} OR timber_type ILIKE $${paramCount} OR product_description ILIKE $${paramCount})`
      params.push(`%${filters.search}%`)
    }

    // Add timber type filter
    if (filters.timber_type) {
      paramCount++
      sql += ` AND timber_type = $${paramCount}`
      params.push(filters.timber_type)
    }

    // Add category filter
    if (filters.category) {
      paramCount++
      sql += ` AND product_category = $${paramCount}`
      params.push(filters.category)
    }

    // Add grade filter
    if (filters.grade) {
      paramCount++
      sql += ` AND product_grade = $${paramCount}`
      params.push(filters.grade)
    }

    sql += ` ORDER BY timber_type, thickness, width, length`

    const data = await db.query(sql, params)
    return data.rows
  } catch (error) {
    console.error("Model error searching products: ", error)
    return []
  }
}

// Get all products (legacy function - kept for compatibility)
async function getAllProducts() {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_category,
             dimensions, thickness, width, length,
             price_per_unit, unit, quantity_in_stock, product_description
      FROM products 
      WHERE is_active = true 
      ORDER BY timber_type, dimensions`
    const data = await db.query(sql)
    return data.rows
  } catch (error) {
    console.error("Model error getting all products: ", error)
    return []
  }
}

module.exports = { 
  getAllTimberTypes,
  getSizeVariantsByTimberType,
  getFeaturedProducts,
  getProductById,
  getAvailableDimensions,
  calculateProductPrice,
  getProductsByCategory,
  searchProducts,
  getAllProducts,
  getProductsByTimberType: getSizeVariantsByTimberType // Alias for compatibility
}