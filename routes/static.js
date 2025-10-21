const express = require("express")
const router = express.Router()
const baseController = require("../controllers/baseController")

// Static routes
router.get("/", baseController.buildHome)

module.exports = router