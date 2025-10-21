const authMiddleware = {}

authMiddleware.checkLogin = async function (req, res, next) {
  if (req.session.user && req.session.user.user_role) {
    next()
  } else {
    req.flash("notice", "Please log in to access this page.")
    res.redirect("/account/login")
  }
}

authMiddleware.checkAdmin = async function (req, res, next) {
  if (req.session.user && req.session.user.user_role === 'Admin') {
    next()
  } else {
    req.flash("notice", "Access denied. Admin privileges required.")
    res.redirect("/account/")
  }
}

authMiddleware.checkManager = async function (req, res, next) {
  const userRole = req.session.user?.user_role
  if (userRole === 'Admin' || userRole === 'Manager' || userRole === 'CEO') {
    next()
  } else {
    req.flash("notice", "Access denied. Manager privileges required.")
    res.redirect("/account/")
  }
}

authMiddleware.checkEmployee = async function (req, res, next) {
  const userRole = req.session.user?.user_role
  if (userRole === 'Admin' || userRole === 'Manager' || userRole === 'CEO' || userRole === 'Employee') {
    next()
  } else {
    req.flash("notice", "Please log in to access this page.")
    res.redirect("/account/login")
  }
}

// Middleware to make user data available to all views
authMiddleware.addUserToLocals = function (req, res, next) {
  if (req.session.user) {
    res.locals.user = req.session.user
    res.locals.isLoggedIn = true
    res.locals.isAdmin = req.session.user.user_role === 'Admin'
    res.locals.isManager = ['Admin', 'Manager', 'CEO'].includes(req.session.user.user_role)
    res.locals.isEmployee = ['Admin', 'Manager', 'CEO', 'Employee'].includes(req.session.user.user_role)
  } else {
    res.locals.user = null
    res.locals.isLoggedIn = false
    res.locals.isAdmin = false
    res.locals.isManager = false
    res.locals.isEmployee = false
  }
  next()
}

module.exports = authMiddleware