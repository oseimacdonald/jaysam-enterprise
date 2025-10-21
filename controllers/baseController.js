const utilities = require("../middleware/utilities")

const baseController = {}

baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("index", {
      title: "Jaysam Enterprise - Timber Merchant",
      nav,
      errors: null,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = baseController