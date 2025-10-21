const db = require("../database/databaseConnection")

const orderModel = {}

/* ***************************
 * Get orders by user ID (or all orders for admin)
 * ************************** */
orderModel.getOrdersByUserId = async function (user_id, isAdmin = false) {
  try {
    let sql, params
    
    if (isAdmin) {
      sql = `
        SELECT 
          o.order_id,
          o.order_date,
          o.order_status,
          o.total_amount,
          o.shipping_city,
          o.shipping_state,
          u.user_firstname,
          u.user_lastname,
          u.user_email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
      `
      params = []
    } else {
      sql = `
        SELECT 
          order_id,
          order_date,
          order_status,
          total_amount,
          shipping_city,
          shipping_state
        FROM orders 
        WHERE user_id = $1
        ORDER BY order_date DESC
      `
      params = [user_id]
    }
    
    const data = await db.query(sql, params)
    return data.rows
  } catch (error) {
    console.error("getOrdersByUserId error: " + error)
    return []
  }
}

/* ***************************
 * Get order by ID with items
 * ************************** */
orderModel.getOrderById = async function (order_id, user_id, isAdmin = false) {
  try {
    let sql, params
    
    if (isAdmin) {
      sql = `
        SELECT 
          o.*,
          u.user_firstname,
          u.user_lastname,
          u.user_email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = $1
      `
      params = [order_id]
    } else {
      sql = `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2`
      params = [order_id, user_id]
    }
    
    const orderData = await db.query(sql, params)
    
    if (orderData.rows.length === 0) {
      return null
    }
    
    // Get order items
    const itemsSql = `
      SELECT 
        oi.*,
        p.product_name,
        p.timber_type,
        p.product_grade,
        p.product_description
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
    `
    const itemsData = await db.query(itemsSql, [order_id])
    
    return {
      order: orderData.rows[0],
      items: itemsData.rows
    }
  } catch (error) {
    console.error("getOrderById error: " + error)
    return null
  }
}

/* ***************************
 * Create order from cart
 * ************************** */
orderModel.createOrderFromCart = async function (orderData) {
  const client = await db.connect()
  
  try {
    await client.query('BEGIN')
    
    // Get cart items and calculate total
    const cartSql = `
      SELECT 
        c.product_id,
        c.quantity,
        p.price_per_unit,
        (p.price_per_unit * c.quantity) as line_total
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `
    const cartItems = await client.query(cartSql, [orderData.user_id])
    
    if (cartItems.rows.length === 0) {
      throw new Error('Cart is empty')
    }
    
    // Calculate total amount
    const totalAmount = cartItems.rows.reduce((total, item) => total + parseFloat(item.line_total), 0)
    
    // Create order
    const orderSql = `
      INSERT INTO orders (
        user_id, total_amount, shipping_address, shipping_city, 
        shipping_state, shipping_zip, shipping_phone, customer_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING order_id
    `
    const orderResult = await client.query(orderSql, [
      orderData.user_id,
      totalAmount,
      orderData.shipping_address,
      orderData.shipping_city,
      orderData.shipping_state,
      orderData.shipping_zip,
      orderData.shipping_phone,
      orderData.customer_notes
    ])
    
    const order_id = orderResult.rows[0].order_id
    
    // Create order items
    for (const item of cartItems.rows) {
      const itemSql = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `
      await client.query(itemSql, [
        order_id,
        item.product_id,
        item.quantity,
        item.price_per_unit,
        item.line_total
      ])
      
      // Update inventory quantity
      const updateInventorySql = `
        UPDATE products 
        SET quantity_in_stock = quantity_in_stock - $1 
        WHERE product_id = $2 AND quantity_in_stock >= $1
      `
      await client.query(updateInventorySql, [item.quantity, item.product_id])
    }
    
    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [orderData.user_id])
    
    await client.query('COMMIT')
    
    return {
      success: true,
      order_id: order_id,
      message: 'Order created successfully'
    }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("createOrderFromCart error: " + error)
    return {
      success: false,
      message: error.message
    }
  } finally {
    client.release()
  }
}

/* ***************************
 * Cancel order
 * ************************** */
orderModel.cancelOrder = async function (order_id, user_id, isAdmin = false) {
  const client = await db.connect()
  
  try {
    await client.query('BEGIN')
    
    // Verify order exists and belongs to user (unless admin)
    let verifySql, verifyParams
    if (isAdmin) {
      verifySql = `SELECT order_id, order_status FROM orders WHERE order_id = $1`
      verifyParams = [order_id]
    } else {
      verifySql = `SELECT order_id, order_status FROM orders WHERE order_id = $1 AND user_id = $2`
      verifyParams = [order_id, user_id]
    }
    
    const order = await client.query(verifySql, verifyParams)
    
    if (order.rows.length === 0) {
      throw new Error('Order not found')
    }
    
    if (order.rows[0].order_status !== 'Pending') {
      throw new Error('Only pending orders can be cancelled')
    }
    
    // Update order status
    await client.query('UPDATE orders SET order_status = $1 WHERE order_id = $2', ['Cancelled', order_id])
    
    // Restore inventory quantities
    const itemsSql = `SELECT product_id, quantity FROM order_items WHERE order_id = $1`
    const items = await client.query(itemsSql, [order_id])
    
    for (const item of items.rows) {
      const restoreSql = `UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE product_id = $2`
      await client.query(restoreSql, [item.quantity, item.product_id])
    }
    
    await client.query('COMMIT')
    
    return {
      success: true,
      message: 'Order cancelled successfully'
    }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("cancelOrder error: " + error)
    return {
      success: false,
      message: error.message
    }
  } finally {
    client.release()
  }
}

module.exports = orderModel