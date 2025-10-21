const accountModel = require("../models/account-model")
const utilities = require("../middleware/utilities")
const bcrypt = require("bcryptjs")

const accountController = {}

// Login view
accountController.buildLogin = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("account/login", {
      title: "Login - Jaysam Enterprise",
      nav,
      errors: null,
      user_email: "", // Changed from account_email
    })
  } catch (error) {
    next(error)
  }
}

// Login process
accountController.login = async function (req, res) {
  let nav = await utilities.getNav()
  const { user_email, user_password } = req.body // Changed from account_email, account_password
  const userData = await accountModel.getUserByEmail(user_email) // Changed function name
  
  if (!userData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      user_email, // Changed from account_email
    })
    return
  }
  
  try {
    if (await bcrypt.compare(user_password, userData.user_password)) { // Changed field name
      delete userData.user_password
      req.session.user = userData // Changed from req.session.account
      req.flash("notice", `Welcome back ${userData.user_firstname}!`) // Changed field name
      res.redirect("/account/")
    } else {
      req.flash("notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        user_email, // Changed from account_email
      })
    }
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing your login.')
    res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      user_email, // Changed from account_email
    })
  }
}

// Account management view
accountController.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("account/management", {
      title: "Account Management - Jaysam Enterprise",
      nav,
      errors: null,
      user: req.session.user // Changed from account
    })
  } catch (error) {
    next(error)
  }
}

// Logout process
accountController.logout = async function (req, res) {
  req.session.destroy()
  res.redirect("/")
}

module.exports = accountController
