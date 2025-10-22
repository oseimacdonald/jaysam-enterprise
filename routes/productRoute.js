const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const db = require('../database/databaseConnection');

// Update validation to match new structure
const productValidationRules = [
    body('product_name').notEmpty().withMessage('Product name is required'),
    body('timber_type').notEmpty().withMessage('Timber type is required'),
    body('product_category').notEmpty().withMessage('Product category is required'),
    body('product_grade').notEmpty().withMessage('Product grade is required'),
    body('dimensions').notEmpty().withMessage('Dimensions are required'),
    body('thickness').isFloat({ gt: 0 }).withMessage('Thickness must be greater than 0'),
    body('width').isFloat({ gt: 0 }).withMessage('Width must be greater than 0'),
    body('length').isFloat({ gt: 0 }).withMessage('Length must be greater than 0'),
    body('price_per_unit').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('quantity_in_stock').isFloat({ min: 0 }).withMessage('Quantity must be non-negative')
];

// ===== MAIN ROUTES =====
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// ===== NEW API ROUTES FOR SIZE SYSTEM =====
router.get('/api/size-variants/:timberType', productController.getSizeVariants);
router.post('/api/calculate-price', productController.calculatePrice);
router.get('/api/featured-products', productController.getFeaturedProductsAPI);

// ===== EXISTING API ROUTES =====
router.get('/api/timber-types', productController.getTimberTypes);
router.get('/api/grades', productController.getGrades);
router.get('/debug/products', productController.debugProducts);

// ===== DEBUG ROUTES (keep existing) =====
router.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', success: true });
});

router.get('/debug/database-status', async (req, res) => {
    try {
        const dbTest = await db.query('SELECT NOW() as current_time');
        const products = await db.query('SELECT * FROM products');
        const activeProducts = await db.query('SELECT * FROM products WHERE is_active = true');
        const timberTypes = await db.query('SELECT DISTINCT timber_type FROM products WHERE timber_type IS NOT NULL');
        const grades = await db.query('SELECT DISTINCT product_grade FROM products WHERE product_grade IS NOT NULL');

        res.json({
            success: true,
            database: {
                connected: true,
                currentTime: dbTest.rows[0].current_time
            },
            products: {
                total: products.rows.length,
                active: activeProducts.rows.length,
                allProducts: products.rows.map(p => ({
                    id: p.product_id,
                    name: p.product_name,
                    timber_type: p.timber_type,
                    product_grade: p.product_grade,
                    dimensions: p.dimensions,
                    is_active: p.is_active
                }))
            },
            availableData: {
                timberTypes: timberTypes.rows.map(row => row.timber_type),
                grades: grades.rows.map(row => row.product_grade)
            }
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message,
            databaseConnected: false
        });
    }
});

router.get('/debug/insert-sample-data', async (req, res) => {
    try {
        await db.query('DELETE FROM products');
        
        await db.query(`
            INSERT INTO products (
                product_name, timber_type, product_category, product_grade, dimensions, 
                thickness, width, length, price_per_unit, unit, 
                quantity_in_stock, product_description, is_active, is_featured
            ) VALUES 
            ('Wawa Lumber', 'Wawa', 'Timber', 'A', '2x4x16', 2, 4, 16, 45.00, 'piece', 100, 'Premium Wawa lumber for construction and furniture', true, true),
            ('Wawa Lumber', 'Wawa', 'Timber', 'A', '1x12x16', 1, 12, 16, 85.00, 'piece', 75, 'Wide Wawa boards for paneling and shelves', true, false),
            ('Dahoma Lumber', 'Dahoma', 'Timber', 'A', '2x6x16', 2, 6, 16, 65.00, 'piece', 60, 'Durable Dahoma wood for heavy construction', true, true),
            ('Plywood Sheet', 'Plywood', 'Plywood', 'B', '1/2x4x8', 0.5, 4, 8, 85.00, 'piece', 200, 'Standard plywood sheet 1/2 inch thickness', true, true),
            ('Marine Plywood', 'Marine Plywood', 'Plywood', 'A', '1/2x4x8', 0.5, 4, 8, 150.00, 'piece', 50, 'Waterproof marine plywood 1/2 inch', true, true)
        `);

        res.json({
            success: true,
            message: 'Sample data inserted successfully with size variants',
            count: 5
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

router.get('/debug/activate-all', async (req, res) => {
    try {
        const result = await db.query('UPDATE products SET is_active = true');
        res.json({
            success: true,
            message: `Activated ${result.rowCount} products`
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ===== PROTECTED ROUTES =====
router.post('/', authMiddleware.checkManager, productValidationRules, productController.createProduct);
router.put('/:id', authMiddleware.checkManager, productValidationRules, productController.updateProduct);
router.delete('/:id', authMiddleware.checkAdmin, productController.deleteProduct);

module.exports = router;