const orderModel = require("../models/order-model")
const utilities = require("../middleware/utilities")

const orderController = {}

/* ***************************
 * Get orders for current user
 * ************************** */
orderController.getOrders = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    const user_id = req.session.user?.user_id // Changed from account_id
    const isAdmin = req.session.user?.user_role === 'Admin' // Changed from account_type
    
    if (!user_id) {
      req.flash('notice', 'Please log in to view orders')
      return res.redirect('/account/login')
    }

    const orders = await orderModel.getOrdersByUserId(user_id, isAdmin) // Changed function name
    
    res.render("./orders/orders", {
      title: isAdmin ? "All Orders" : "My Orders",
      nav,
      orders,
      messages: req.flash()
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Get order details
 * ************************** */
orderController.getOrderDetails = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    const order_id = req.params.id
    const user_id = req.session.user?.user_id // Changed from account_id
    const isAdmin = req.session.user?.user_role === 'Admin' // Changed from account_type

    if (!user_id) {
      req.flash('notice', 'Please log in to view order details')
      return res.redirect('/account/login')
    }

    const orderDetails = await orderModel.getOrderById(order_id, user_id, isAdmin) // Changed params
    
    if (!orderDetails) {
      req.flash('notice', 'Order not found')
      return res.redirect('/orders')
    }

    res.render("./orders/order-details", {
      title: "Order Details",
      nav,
      order: orderDetails.order,
      items: orderDetails.items,
      messages: req.flash()
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Create new order from cart
 * ************************** */
orderController.createOrder = async function (req, res, next) {
  try {
    const { shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone, customer_notes } = req.body
    const user_id = req.session.user?.user_id // Changed from account_id

    if (!user_id) {
      req.flash('notice', 'Please log in to place an order')
      return res.redirect('/account/login')
    }

    const orderData = {
      user_id, // Changed from account_id
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
      customer_notes
    }

    const result = await orderModel.createOrderFromCart(orderData)
    
    if (result.success) {
      req.flash('success', `Order placed successfully! Order #${result.order_id}`)
      res.redirect(`/orders/${result.order_id}`)
    } else {
      req.flash('notice', result.message || 'Failed to place order')
      res.redirect('/cart')
    }
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Cancel order
 * ************************** */
orderController.cancelOrder = async function (req, res, next) {
  try {
    const order_id = req.params.id
    const user_id = req.session.user?.user_id // Changed from account_id
    const isAdmin = req.session.user?.user_role === 'Admin' // Changed from account_type

    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Not logged in' })
    }

    const result = await orderModel.cancelOrder(order_id, user_id, isAdmin) // Changed params
    
    if (result.success) {
      req.flash('success', 'Order cancelled successfully')
      res.json({ success: true, message: 'Order cancelled' })
    } else {
      res.json({ success: false, message: result.message })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

module.exports = orderController