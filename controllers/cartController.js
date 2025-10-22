const cartModel = require("../models/cart-model")
const utilities = require("../middleware/utilities")

const cartController = {}

/* ***************************
 * Get cart for current user
 * ************************** */
cartController.getCart = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    const user_id = req.session.user?.user_id
    
    if (!user_id) {
      req.flash('notice', 'Please log in to view your cart')
      return res.redirect('/account/login')
    }

    const cartData = await cartModel.getCartByUserId(user_id)
    
    // Calculate cart totals
    const cartTotal = cartData.reduce((total, item) => total + parseFloat(item.line_total || 0), 0)
    const itemCount = cartData.reduce((count, item) => count + parseInt(item.quantity || 0), 0)

    res.render("./cart/cart", {
      title: "Shopping Cart - Jaysam Enterprise",
      nav,
      cartItems: cartData,
      cartTotal: cartTotal.toFixed(2),
      itemCount: itemCount,
      messages: req.flash()
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 * Add item to cart (with size data)
 * ************************** */
cartController.addToCart = async function (req, res, next) {
  try {
    const { product_id, quantity = 1 } = req.body
    const user_id = req.session.user?.user_id

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in to add items to cart' 
      })
    }

    if (!product_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      })
    }

    const result = await cartModel.addToCart(user_id, product_id, parseInt(quantity))
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Item added to cart successfully',
        cartCount: result.cartCount
      })
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message || 'Failed to add item to cart' 
      })
    }
  } catch (error) {
    console.error('Add to cart error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding item to cart' 
    })
  }
}

/* ***************************
 * Update cart item quantity
 * ************************** */
cartController.updateCart = async function (req, res, next) {
  try {
    const { cart_id, quantity } = req.body
    const user_id = req.session.user?.user_id

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in to update cart' 
      })
    }

    const result = await cartModel.updateCartItem(cart_id, user_id, parseInt(quantity))
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Cart updated successfully',
        updatedItem: result.updatedItem
      })
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message || 'Failed to update cart' 
      })
    }
  } catch (error) {
    console.error('Update cart error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating cart' 
    })
  }
}

/* ***************************
 * Remove item from cart
 * ************************** */
cartController.removeFromCart = async function (req, res, next) {
  try {
    const { cart_id } = req.body
    const user_id = req.session.user?.user_id

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in to manage cart' 
      })
    }

    const result = await cartModel.removeFromCart(cart_id, user_id)
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Item removed from cart' 
      })
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to remove item' 
      })
    }
  } catch (error) {
    console.error('Remove from cart error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error removing item' 
    })
  }
}

/* ***************************
 * Clear entire cart
 * ************************** */
cartController.clearCart = async function (req, res, next) {
  try {
    const user_id = req.session.user?.user_id

    if (!user_id) {
      req.flash('notice', 'Please log in to manage your cart')
      return res.redirect('/account/login')
    }

    const result = await cartModel.clearCart(user_id)
    
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

/* ***************************
 * Get cart count for navbar
 * ************************** */
cartController.getCartCount = async function (req, res, next) {
  try {
    const user_id = req.session.user?.user_id
    
    if (!user_id) {
      return res.json({ count: 0 })
    }

    const count = await cartModel.getCartCount(user_id)
    res.json({ count: count })
  } catch (error) {
    console.error('Get cart count error:', error)
    res.json({ count: 0 })
  }
}

module.exports = cartController