const express = require("express")
const router = express.Router()
const customerController = require("../controllers/customerController")
const authMiddleware = require("../middleware/authMiddleware")

// Customer routes - managers and admins only
router.get("/", authMiddleware.checkManager, customerController.getAllCustomers)
//router.get("/:id", authMiddleware.checkManager, customerController.getCustomerDetails)
router.post("/", authMiddleware.checkManager, customerController.createCustomer)
//router.put("/:id", authMiddleware.checkManager, customerController.updateCustomer)
// Add other customer routes as needed

module.exports = router