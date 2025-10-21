const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")
const authMiddleware = require("../middleware/authMiddleware")

// Order routes - protect all order routes
router.get("/", authMiddleware.checkEmployee, orderController.getOrders)
router.get("/:id", authMiddleware.checkEmployee, orderController.getOrderDetails)
router.post("/create", authMiddleware.checkEmployee, orderController.createOrder)
router.post("/:id/cancel", authMiddleware.checkEmployee, orderController.cancelOrder)

module.exports = router