const db = require("../database/databaseConnection")

const cartModel = {}

/* ***************************
 * Get cart by user ID
 * ************************** */
cartModel.getCartByUserId = async function (user_id) {
  try {
    const sql = `
      SELECT 
        c.cart_id,
        c.quantity,
        p.product_id,
        p.product_name,
        p.product_description,
        p.product_image,
        p.timber_type,
        p.product_grade,
        p.dimensions,
        p.length,
        p.width,
        p.thickness,
        p.price_per_unit,
        (p.price_per_unit * c.quantity) as line_total
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
      ORDER BY c.added_date DESC
    `
    const data = await db.query(sql, [user_id])
    return data.rows
  } catch (error) {
    console.error("getCartByUserId error: " + error)
    return []
  }
}

/* ***************************
 * Add item to cart
 * ************************** */
cartModel.addToCart = async function (user_id, product_id, quantity) {
  try {
    // Check if item already exists in cart
    const checkSql = `SELECT cart_id, quantity FROM cart WHERE user_id = $1 AND product_id = $2`
    const existingItem = await db.query(checkSql, [user_id, product_id])
    
    if (existingItem.rows.length > 0) {
      // Update quantity if item exists
      const updateSql = `UPDATE cart SET quantity = quantity + $1 WHERE cart_id = $2`
      await db.query(updateSql, [quantity, existingItem.rows[0].cart_id])
    } else {
      // Insert new item
      const insertSql = `INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)`
      await db.query(insertSql, [user_id, product_id, quantity])
    }
    
    return true
  } catch (error) {
    console.error("addToCart error: " + error)
    return false
  }
}

/* ***************************
 * Update cart item quantity
 * ************************** */
cartModel.updateCartItem = async function (cart_id, user_id, quantity) {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const deleteSql = `DELETE FROM cart WHERE cart_id = $1 AND user_id = $2`
      await db.query(deleteSql, [cart_id, user_id])
    } else {
      // Update quantity
      const sql = `UPDATE cart SET quantity = $1 WHERE cart_id = $2 AND user_id = $3`
      await db.query(sql, [quantity, cart_id, user_id])
    }
    
    return true
  } catch (error) {
    console.error("updateCartItem error: " + error)
    return false
  }
}

/* ***************************
 * Remove item from cart
 * ************************** */
cartModel.removeFromCart = async function (cart_id, user_id) {
  try {
    const sql = `DELETE FROM cart WHERE cart_id = $1 AND user_id = $2`
    await db.query(sql, [cart_id, user_id])
    return true
  } catch (error) {
    console.error("removeFromCart error: " + error)
    return false
  }
}

/* ***************************
 * Clear entire cart
 * ************************** */
cartModel.clearCart = async function (user_id) {
  try {
    const sql = `DELETE FROM cart WHERE user_id = $1`
    await db.query(sql, [user_id])
    return true
  } catch (error) {
    console.error("clearCart error: " + error)
    return false
  }
}

/* ***************************
 * Get cart total
 * ************************** */
cartModel.getCartTotal = async function (user_id) {
  try {
    const sql = `
      SELECT SUM(p.price_per_unit * c.quantity) as total
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `
    const data = await db.query(sql, [user_id])
    return data.rows[0]?.total || 0
  } catch (error) {
    console.error("getCartTotal error: " + error)
    return 0
  }
}

module.exports = cartModel