const express = require('express');
const customerController = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, customerController.getAllCustomers);
router.post('/', auth, customerController.createCustomer);

module.exports = router;