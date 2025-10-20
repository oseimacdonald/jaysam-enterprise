const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/timber-types', productController.getTimberTypes);
router.get('/grades', productController.getGrades);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', [
    auth,
    adminAuth,
    body('name').notEmpty().withMessage('Product name is required'),
    body('timber_type').notEmpty().withMessage('Timber type is required'),
    body('price_per_unit').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity_in_stock').isFloat({ min: 0 }).withMessage('Quantity must be a positive number')
], productController.createProduct);

router.put('/:id', [
    auth,
    adminAuth,
    body('name').notEmpty().withMessage('Product name is required'),
    body('timber_type').notEmpty().withMessage('Timber type is required'),
    body('price_per_unit').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity_in_stock').isFloat({ min: 0 }).withMessage('Quantity must be a positive number')
], productController.updateProduct);

router.delete('/:id', [auth, adminAuth], productController.deleteProduct);

module.exports = router;