const express = require("express")
const router = express.Router()
const cartController = require("../controllers/cartController")
const authMiddleware = require("../middleware/authMiddleware")

// Cart routes - public access for browsing, protected for actions
router.get("/", cartController.getCart) // Public can view cart
router.post("/add", cartController.addToCart) // Public can add to cart
router.post("/update", authMiddleware.checkEmployee, cartController.updateCart) // Only employees can update
router.post("/remove", authMiddleware.checkEmployee, cartController.removeFromCart) // Only employees can remove
router.post("/clear", authMiddleware.checkEmployee, cartController.clearCart) // Only employees can clear

module.exports = router