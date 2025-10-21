const express = require("express")
const router = express.Router()
const accountController = require("../controllers/accountController")
const authMiddleware = require("../middleware/authMiddleware")

// Login routes
router.get("/login", accountController.buildLogin)
router.post("/login", accountController.login)

// Account management routes
router.get("/", authMiddleware.checkLogin, accountController.buildManagement)

// Logout route
router.get("/logout", accountController.logout)

module.exports = router