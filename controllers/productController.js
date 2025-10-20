const { validationResult } = require('express-validator');
const db = require('../config/database');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const { search, timber_type, grade, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT * FROM products 
                WHERE is_active = true
            `;
            let countQuery = `SELECT COUNT(*) FROM products WHERE is_active = true`;
            const params = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
                countQuery += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            if (timber_type) {
                paramCount++;
                query += ` AND timber_type = $${paramCount}`;
                countQuery += ` AND timber_type = $${paramCount}`;
                params.push(timber_type);
            }

            if (grade) {
                paramCount++;
                query += ` AND grade = $${paramCount}`;
                countQuery += ` AND grade = $${paramCount}`;
                params.push(grade);
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(parseInt(limit), offset);

            const productsResult = await db.query(query, params);
            const countResult = await db.query(countQuery, params.slice(0, -2));

            res.json({
                products: productsResult.rows,
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
                currentPage: parseInt(page),
                totalProducts: parseInt(countResult.rows[0].count)
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('SELECT * FROM products WHERE id = $1 AND is_active = true', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ product: result.rows[0] });
        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                name, timber_type, grade, dimensions, length, width, thickness,
                price_per_unit, unit, quantity_in_stock, description, image_url
            } = req.body;

            const result = await db.query(
                `INSERT INTO products (
                    name, timber_type, grade, dimensions, length, width, thickness,
                    price_per_unit, unit, quantity_in_stock, description, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [name, timber_type, grade, dimensions, length, width, thickness,
                 price_per_unit, unit, quantity_in_stock, description, image_url]
            );

            res.status(201).json({ product: result.rows[0] });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const {
                name, timber_type, grade, dimensions, length, width, thickness,
                price_per_unit, unit, quantity_in_stock, description, image_url
            } = req.body;

            const result = await db.query(
                `UPDATE products SET 
                    name = $1, timber_type = $2, grade = $3, dimensions = $4,
                    length = $5, width = $6, thickness = $7, price_per_unit = $8,
                    unit = $9, quantity_in_stock = $10, description = $11,
                    image_url = $12, updated_at = CURRENT_TIMESTAMP
                WHERE id = $13 AND is_active = true
                RETURNING *`,
                [name, timber_type, grade, dimensions, length, width, thickness,
                 price_per_unit, unit, quantity_in_stock, description, image_url, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ product: result.rows[0] });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await db.query(
                'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    getTimberTypes: async (req, res) => {
        try {
            const result = await db.query('SELECT DISTINCT timber_type FROM products WHERE is_active = true ORDER BY timber_type');
            const timberTypes = result.rows.map(row => row.timber_type);
            res.json({ timberTypes });
        } catch (error) {
            console.error('Get timber types error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    getGrades: async (req, res) => {
        try {
            const result = await db.query('SELECT DISTINCT grade FROM products WHERE is_active = true ORDER BY grade');
            const grades = result.rows.map(row => row.grade);
            res.json({ grades });
        } catch (error) {
            console.error('Get grades error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = productController;