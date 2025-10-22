const db = require("../database/databaseConnection")

const cartModel = {}

/* ***************************
 * Get cart by user ID with product details
 * ************************** */
cartModel.getCartByUserId = async function (user_id) {
  try {
    const sql = `
      SELECT 
        c.cart_id,
        c.quantity,
        c.added_date,
        p.product_id,
        p.product_name,
        p.timber_type,
        p.product_category,
        p.product_grade,
        p.dimensions,
        p.thickness,
        p.width,
        p.length,
        p.price_per_unit,
        p.unit,
        p.quantity_in_stock,
        p.product_description,
        p.product_image,
        (p.price_per_unit * c.quantity) as line_total
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1 AND p.is_active = true
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
 * Add item to cart with stock validation
 * ************************** */
cartModel.addToCart = async function (user_id, product_id, quantity) {
  try {
    // Validate product exists and is active
    const productCheck = await db.query(
      'SELECT product_id, product_name, quantity_in_stock FROM products WHERE product_id = $1 AND is_active = true',
      [product_id]
    )
    
    if (productCheck.rows.length === 0) {
      return { success: false, message: 'Product not found or unavailable' }
    }
    
    const product = productCheck.rows[0]
    
    // Check stock availability
    if (product.quantity_in_stock < quantity) {
      return { 
        success: false, 
        message: `Only ${product.quantity_in_stock} units available in stock` 
      }
    }
    
    // Check if item already exists in cart
    const checkSql = `SELECT cart_id, quantity FROM cart WHERE user_id = $1 AND product_id = $2`
    const existingItem = await db.query(checkSql, [user_id, product_id])
    
    let newQuantity = quantity
    
    if (existingItem.rows.length > 0) {
      // Check if updated quantity exceeds stock
      const updatedQuantity = existingItem.rows[0].quantity + quantity
      if (updatedQuantity > product.quantity_in_stock) {
        return { 
          success: false, 
          message: `Cannot add more than available stock (${product.quantity_in_stock} units)` 
        }
      }
      
      // Update quantity if item exists
      const updateSql = `UPDATE cart SET quantity = quantity + $1, added_date = NOW() WHERE cart_id = $2`
      await db.query(updateSql, [quantity, existingItem.rows[0].cart_id])
      newQuantity = updatedQuantity
    } else {
      // Insert new item
      const insertSql = `INSERT INTO cart (user_id, product_id, quantity, added_date) VALUES ($1, $2, $3, NOW())`
      await db.query(insertSql, [user_id, product_id, quantity])
    }
    
    // Get updated cart count
    const countResult = await db.query('SELECT COUNT(*) as count FROM cart WHERE user_id = $1', [user_id])
    const cartCount = parseInt(countResult.rows[0].count)
    
    return { 
      success: true, 
      message: 'Item added to cart successfully',
      cartCount: cartCount,
      quantity: newQuantity
    }
  } catch (error) {
    console.error("addToCart error: " + error)
    return { success: false, message: 'Database error adding to cart' }
  }
}

/* ***************************
 * Update cart item quantity with stock validation
 * ************************** */
cartModel.updateCartItem = async function (cart_id, user_id, quantity) {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const deleteSql = `DELETE FROM cart WHERE cart_id = $1 AND user_id = $2`
      await db.query(deleteSql, [cart_id, user_id])
      return { success: true, message: 'Item removed from cart' }
    }
    
    // Get product details for stock validation
    const productSql = `
      SELECT p.quantity_in_stock, p.product_name 
      FROM cart c 
      JOIN products p ON c.product_id = p.product_id 
      WHERE c.cart_id = $1 AND c.user_id = $2
    `
    const productResult = await db.query(productSql, [cart_id, user_id])
    
    if (productResult.rows.length === 0) {
      return { success: false, message: 'Cart item not found' }
    }
    
    const product = productResult.rows[0]
    
    // Check stock availability
    if (product.quantity_in_stock < quantity) {
      return { 
        success: false, 
        message: `Only ${product.quantity_in_stock} units available for ${product.product_name}` 
      }
    }
    
    // Update quantity
    const updateSql = `UPDATE cart SET quantity = $1 WHERE cart_id = $2 AND user_id = $3`
    await db.query(updateSql, [quantity, cart_id, user_id])
    
    // Get updated item details
    const updatedItemSql = `
      SELECT c.quantity, p.price_per_unit, (p.price_per_unit * c.quantity) as line_total
      FROM cart c 
      JOIN products p ON c.product_id = p.product_id 
      WHERE c.cart_id = $1
    `
    const updatedItem = await db.query(updatedItemSql, [cart_id])
    
    return { 
      success: true, 
      message: 'Cart updated successfully',
      updatedItem: updatedItem.rows[0]
    }
  } catch (error) {
    console.error("updateCartItem error: " + error)
    return { success: false, message: 'Database error updating cart' }
  }
}

/* ***************************
 * Remove item from cart
 * ************************** */
cartModel.removeFromCart = async function (cart_id, user_id) {
  try {
    const sql = `DELETE FROM cart WHERE cart_id = $1 AND user_id = $2`
    const result = await db.query(sql, [cart_id, user_id])
    return result.rowCount > 0
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
      WHERE c.user_id = $1 AND p.is_active = true
    `
    const data = await db.query(sql, [user_id])
    return parseFloat(data.rows[0]?.total || 0)
  } catch (error) {
    console.error("getCartTotal error: " + error)
    return 0
  }
}

/* ***************************
 * Get cart item count
 * ************************** */
cartModel.getCartCount = async function (user_id) {
  try {
    const sql = `SELECT COUNT(*) as count FROM cart WHERE user_id = $1`
    const data = await db.query(sql, [user_id])
    return parseInt(data.rows[0]?.count || 0)
  } catch (error) {
    console.error("getCartCount error: " + error)
    return 0
  }
}

/* ***************************
 * Check if product is in cart
 * ************************** */
cartModel.isInCart = async function (user_id, product_id) {
  try {
    const sql = `SELECT cart_id FROM cart WHERE user_id = $1 AND product_id = $2`
    const data = await db.query(sql, [user_id, product_id])
    return data.rows.length > 0
  } catch (error) {
    console.error("isInCart error: " + error)
    return false
  }
}

module.exports = cartModel