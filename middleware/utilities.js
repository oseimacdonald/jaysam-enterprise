const utilities = {}

/* ***************************
 * Get navigation
 * ************************** */
utilities.getNav = async function () {
  try {
    return `
      <nav>
        <ul>
          <li><a href="/" title="Home page">Home</a></li>
          <li><a href="/products" title="Browse Products">Products</a></li>
          <li><a href="/cart" title="Shopping Cart">Cart</a></li>
          <li><a href="/orders" title="My Orders">Orders</a></li>
          <li><a href="/customers" title="Customer Management">Customers</a></li>
          <li><a href="/account/login" title="Login">Login</a></li>
        </ul>
      </nav>
    `
  } catch (error) {
    console.error('getNav error:', error)
    return '<nav><ul><li><a href="/">Home</a></li></ul></nav>'
  }
}

/* ***************************
 * Check if user is logged in
 * ************************** */
utilities.checkLogin = (req, res, next) => {
  if (req.session.account_id) {
    return next()
  }
  req.flash('notice', 'Please log in to access this page.')
  return res.redirect('/account/login')
}

/* ***************************
 * Check if user is admin
 * ************************** */
utilities.checkAdmin = (req, res, next) => {
  if (req.session.account_id && req.session.account_type === 'Admin') {
    return next()
  }
  req.flash('notice', 'Access denied. Admin privileges required.')
  return res.redirect('/account/login')
}

/* ***************************
 * Format currency
 * ************************** */
utilities.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/* ***************************
 * Get current date
 * ************************** */
utilities.getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

module.exports = utilities