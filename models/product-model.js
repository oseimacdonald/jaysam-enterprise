const db = require("../database/databaseConnection")

async function getAllProducts() {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_grade, dimensions, 
             price_per_unit, unit, quantity_in_stock, product_description
      FROM products 
      WHERE is_active = true 
      ORDER BY product_name`
    const data = await db.query(sql)
    return data.rows
  } catch (error) {
    console.error("Model error: ", error)
    return []
  }
}

async function getProductsByTimberType(timber_type) {
  try {
    const sql = `
      SELECT product_id, product_name, timber_type, product_grade, dimensions, 
             price_per_unit, quantity_in_stock
      FROM products 
      WHERE timber_type = $1 AND is_active = true 
      ORDER BY product_name`
    const data = await db.query(sql, [timber_type])
    return data.rows
  } catch (error) {
    console.error("Model error: ", error)
    return []
  }
}

async function getProductById(product_id) {
  try {
    const sql = `
      SELECT * FROM products 
      WHERE product_id = $1 AND is_active = true`
    const data = await db.query(sql, [product_id])
    return data.rows[0]
  } catch (error) {
    console.error("Model error: ", error)
    return null
  }
}

module.exports = { getAllProducts, getProductsByTimberType, getProductById }