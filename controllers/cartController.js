const cartModel = require("../models/cart-model")
const utilities = require("../middleware/utilities")

const cartController = {}

/* ***************************
 * Get cart for current user
 * ************************** */
cartController.getCart = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    const user_id = req.session.user?.user_id // Changed from account_id
    
    if (!user_id) {
      req.flash('notice', 'Please log in to view your cart')
      return res.redirect('/account/login')
    }

    const cartData = await cartModel.getCartByUserId(user_id) // Changed function name
    
    res.render("./cart/cart", {
      title: "Shopping Cart",
      nav,
      cartItems: cartData,
      messages: req.flash()
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Add item to cart
 * ************************** */
cartController.addToCart = async function (req, res, next) {
  try {
    const { product_id, quantity = 1 } = req.body // Changed from inv_id
    const user_id = req.session.user?.user_id // Changed from account_id

    if (!user_id) {
      req.flash('notice', 'Please log in to add items to cart')
      return res.redirect('/account/login')
    }

    const result = await cartModel.addToCart(user_id, product_id, parseInt(quantity)) // Changed params
    
    if (result) {
      req.flash('success', 'Item added to cart successfully')
    } else {
      req.flash('notice', 'Failed to add item to cart')
    }
    
    res.redirect('/cart')
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Update cart item quantity
 * ************************** */
cartController.updateCart = async function (req, res, next) {
  try {
    const { cart_id, quantity } = req.body
    const user_id = req.session.user?.user_id // Changed from account_id

    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Not logged in' })
    }

    const result = await cartModel.updateCartItem(cart_id, user_id, parseInt(quantity)) // Changed param
    
    if (result) {
      res.json({ success: true, message: 'Cart updated successfully' })
    } else {
      res.json({ success: false, message: 'Failed to update cart' })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

/* ***************************
 * Remove item from cart
 * ************************** */
cartController.removeFromCart = async function (req, res, next) {
  try {
    const { cart_id } = req.body
    const user_id = req.session.user?.user_id // Changed from account_id

    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Not logged in' })
    }

    const result = await cartModel.removeFromCart(cart_id, user_id) // Changed param
    
    if (result) {
      res.json({ success: true, message: 'Item removed from cart' })
    } else {
      res.json({ success: false, message: 'Failed to remove item' })
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

/* ***************************
 * Clear entire cart
 * ************************** */
cartController.clearCart = async function (req, res, next) {
  try {
    const user_id = req.session.user?.user_id // Changed from account_id

    if (!user_id) {
      req.flash('notice', 'Please log in to manage your cart')
      return res.redirect('/account/login')
    }

    const result = await cartModel.clearCart(user_id) // Changed param
    
    if (result) {
      req.flash('success', 'Cart cleared successfully')
    } else {
      req.flash('notice', 'Failed to clear cart')
    }
    
    res.redirect('/cart')
  } catch (error) {
    next(error)
  }
}

module.exports = cartController