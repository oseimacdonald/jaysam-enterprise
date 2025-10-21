const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const db = require('../database/databaseConnection'); // Make sure this is included

// Update validation to match `products` table fields
const productValidationRules = [
    body('product_name').notEmpty().withMessage('Product name is required'),
    body('timber_type').notEmpty().withMessage('Timber type is required'),
    body('product_grade').notEmpty().withMessage('Product grade is required'),
    body('dimensions').notEmpty().withMessage('Dimensions are required'),
    body('length').isFloat({ gt: 0 }).withMessage('Length must be greater than 0'),
    body('width').isFloat({ gt: 0 }).withMessage('Width must be greater than 0'),
    body('thickness').isFloat({ gt: 0 }).withMessage('Thickness must be greater than 0'),
    body('price_per_unit').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('quantity_in_stock').isFloat({ min: 0 }).withMessage('Quantity must be non-negative')
];

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// API routes for filters
router.get('/api/timber-types', productController.getTimberTypes);
router.get('/api/grades', productController.getGrades);
router.get('/debug/products', productController.debugProducts);

// === ADD THESE DEBUG ROUTES ===

// Test if basic API is working
router.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', success: true });
});

// Check database connection and products
router.get('/debug/database-status', async (req, res) => {
    try {
        // Check if we can connect to database
        const dbTest = await db.query('SELECT NOW() as current_time');
        
        // Check products
        const products = await db.query('SELECT * FROM products');
        const activeProducts = await db.query('SELECT * FROM products WHERE is_active = true');
        
        // Check timber types and grades from ALL products
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

// Force insert sample data with proper values
router.get('/debug/insert-sample-data', async (req, res) => {
    try {
        // Clear existing data to avoid conflicts
        await db.query('DELETE FROM products');
        
        // Insert fresh sample data with proper timber types and grades
        await db.query(`
            INSERT INTO products (
                product_name, timber_type, product_grade, dimensions, 
                length, width, thickness, price_per_unit, unit, 
                quantity_in_stock, product_description, is_active
            ) VALUES 
            ('Teak Luxury Planks', 'Teak', 'A', '100x50mm', 2.4, 0.1, 0.05, 1200.00, 'cubic_meter', 15.5, 'Premium quality teak wood planks', true),
            ('Oak Premium Boards', 'Oak', 'B', '150x150mm', 3.0, 0.15, 0.15, 950.00, 'cubic_meter', 22.2, 'Premium oak boards for luxury furniture', true),
            ('Pine Construction Grade', 'Pine', 'C', '50x25mm', 2.4, 0.05, 0.025, 280.00, 'cubic_meter', 60.8, 'Construction grade pine for structural work', true),
            ('Mahogany Luxury Logs', 'Mahogany', 'A', 'Various', 4.0, 0.3, 0.3, 1500.00, 'cubic_meter', 8.3, 'Luxury mahogany logs for high-end furniture', true),
            ('Cedar Premium Planks', 'Cedar', 'B', '75x25mm', 2.4, 0.075, 0.025, 650.00, 'cubic_meter', 35.0, 'Aromatic cedar planks for premium projects', true)
        `);

        res.json({
            success: true,
            message: 'Sample data inserted successfully with timber types (Teak, Oak, Pine, Mahogany, Cedar) and grades (A, B, C)',
            count: 5
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Activate all products
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

// Protected routes
router.post('/', authMiddleware.checkManager, productValidationRules, productController.createProduct);
router.put('/:id', authMiddleware.checkManager, productValidationRules, productController.updateProduct);
router.delete('/:id', authMiddleware.checkAdmin, productController.deleteProduct);

module.exports = router;