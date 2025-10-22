const express = require("express")
const router = express.Router()
const cartController = require("../controllers/cartController")
const authMiddleware = require("../middleware/authMiddleware")

// Cart routes
router.get("/", cartController.getCart)
router.post("/add", authMiddleware.checkLogin, cartController.addToCart)
router.post("/update", authMiddleware.checkLogin, cartController.updateCart)
router.post("/remove", authMiddleware.checkLogin, cartController.removeFromCart)
router.post("/clear", authMiddleware.checkLogin, cartController.clearCart)

// Special handling for /count - return JSON even when not logged in
router.get("/count", (req, res, next) => {
  if (!req.session.user) {
    // Return 0 count for non-logged-in users (JSON response)
    return res.json({ count: 0 })
  }
  // If logged in, use the normal controller
  cartController.getCartCount(req, res, next)
})

module.exports = router