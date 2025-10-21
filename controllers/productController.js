const { validationResult } = require('express-validator');
const db = require('../database/databaseConnection');

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

            if (search && search.trim() !== '') {
                query += ` AND (product_name ILIKE $${params.length + 1} OR product_description ILIKE $${params.length + 1})`;
                countQuery += ` AND (product_name ILIKE $${params.length + 1} OR product_description ILIKE $${params.length + 1})`;
                params.push(`%${search}%`);
            }

            if (timber_type) {
                query += ` AND timber_type = $${params.length + 1}`;
                countQuery += ` AND timber_type = $${params.length + 1}`;
                params.push(timber_type);
            }

            if (grade) {
                query += ` AND product_grade = $${params.length + 1}`;
                countQuery += ` AND product_grade = $${params.length + 1}`;
                params.push(grade);
            }

            query += ` ORDER BY created_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(parseInt(limit), offset);

            const productsResult = await db.query(query, params);
            const countResult = await db.query(countQuery, params.slice(0, -2));

            res.render('products/management', {
                title: 'Products - Jaysam Enterprise',
                products: productsResult.rows,
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
                currentPage: parseInt(page),
                totalProducts: parseInt(countResult.rows[0].count),
                search: search || '',
                timber_type: timber_type || '',
                grade: grade || '',
                messages: req.flash()
            });
        } catch (error) {
            console.error('Get products error:', error);
            req.flash('error', 'Error loading products');
            res.render('products/management', {
                title: 'Products - Jaysam Enterprise',
                products: [],
                messages: req.flash()
            });
        }
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('SELECT * FROM products WHERE product_id = $1 AND is_active = true', [id]);

            if (result.rows.length === 0) {
                req.flash('error', 'Product not found');
                return res.redirect('/products');
            }

            res.render('products/details', {
                title: 'Product Details - Jaysam Enterprise',
                product: result.rows[0],
                messages: req.flash()
            });
        } catch (error) {
            console.error('Get product by ID error:', error);
            req.flash('error', 'Error loading product');
            res.redirect('/products');
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
            const result = await db.query('SELECT DISTINCT product_grade FROM products WHERE is_active = true ORDER BY product_grade');
            const grades = result.rows.map(row => row.product_grade);
            res.json({ grades });
        } catch (error) {
            console.error('Get grades error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(err => err.msg).join(', '));
                return res.redirect('/products');
            }

            const {
                product_name, timber_type, product_grade, dimensions, length, width, thickness,
                price_per_unit, unit, quantity_in_stock, product_description, product_image
            } = req.body;

            await db.query(
                `INSERT INTO products (
                    product_name, timber_type, product_grade, dimensions, length, width, thickness,
                    price_per_unit, unit, quantity_in_stock, product_description, product_image
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    product_name, timber_type, product_grade, dimensions, length, width, thickness,
                    price_per_unit, unit, quantity_in_stock, product_description, product_image
                ]
            );

            req.flash('success', 'Product created successfully');
            res.redirect('/products');
        } catch (error) {
            console.error('Create product error:', error);
            req.flash('error', 'Error creating product');
            res.redirect('/products');
        }
    },

    // ADD THESE MISSING METHODS:
    updateProduct: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(err => err.msg).join(', '));
                return res.redirect('/products');
            }

            const { id } = req.params;
            const {
                product_name, timber_type, product_grade, dimensions, length, width, thickness,
                price_per_unit, unit, quantity_in_stock, product_description, product_image
            } = req.body;

            const result = await db.query(
                `UPDATE products SET 
                    product_name = $1, timber_type = $2, product_grade = $3, dimensions = $4,
                    length = $5, width = $6, thickness = $7, price_per_unit = $8,
                    unit = $9, quantity_in_stock = $10, product_description = $11,
                    product_image = $12
                WHERE product_id = $13 AND is_active = true
                RETURNING *`,
                [
                    product_name, timber_type, product_grade, dimensions, length, width, thickness,
                    price_per_unit, unit, quantity_in_stock, product_description, product_image, id
                ]
            );

            if (result.rows.length === 0) {
                req.flash('error', 'Product not found');
                return res.redirect('/products');
            }

            req.flash('success', 'Product updated successfully');
            res.redirect('/products');
        } catch (error) {
            console.error('Update product error:', error);
            req.flash('error', 'Error updating product');
            res.redirect('/products');
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await db.query(
                'UPDATE products SET is_active = false WHERE product_id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                req.flash('error', 'Product not found');
                return res.redirect('/products');
            }

            req.flash('success', 'Product deleted successfully');
            res.redirect('/products');
        } catch (error) {
            console.error('Delete product error:', error);
            req.flash('error', 'Error deleting product');
            res.redirect('/products');
        }
    },

    // Add debug method
    debugProducts: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM products WHERE is_active = true LIMIT 5');
            res.json({
                success: true,
                count: result.rows.length,
                columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
                data: result.rows
            });
        } catch (error) {
            res.json({ success: false, error: error.message });
        }
    }
};

module.exports = productController;