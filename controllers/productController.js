const { validationResult } = require('express-validator');
const productModel = require('../models/product-model'); // Import the new model

const productController = {
    // Updated to use timber type grouping
    getAllProducts: async (req, res) => {
        try {
            const { search, category, grade, page = 1, limit = 12 } = req.query;
            
            // Get timber types for main display
            const timberTypes = await productModel.getAllTimberTypes();
            
            // Get featured products for carousel
            const featuredProducts = await productModel.getFeaturedProducts();
            
            // Apply filters if provided
            let filteredTimberTypes = timberTypes;
            
            if (search && search.trim() !== '') {
                filteredTimberTypes = timberTypes.filter(timber => 
                    timber.timber_type.toLowerCase().includes(search.toLowerCase()) ||
                    timber.product_category.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            if (category) {
                filteredTimberTypes = filteredTimberTypes.filter(timber => 
                    timber.product_category === category
                );
            }

            // Calculate pagination
            const totalProducts = filteredTimberTypes.length;
            const totalPages = Math.ceil(totalProducts / limit);
            const currentPage = parseInt(page);
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedTimberTypes = filteredTimberTypes.slice(startIndex, endIndex);

            res.render('products/management', {
                title: 'Timber Products - Jaysam Enterprise',
                timberTypes: paginatedTimberTypes,
                featuredProducts: featuredProducts,
                totalPages: totalPages,
                currentPage: currentPage,
                totalProducts: totalProducts,
                search: search || '',
                category: category || '',
                grade: grade || '',
                messages: req.flash(),
                isManager: req.session.user?.user_role === 'Manager' || req.session.user?.user_role === 'Admin'
            });
        } catch (error) {
            console.error('Get products error:', error);
            req.flash('error', 'Error loading products');
            res.render('products/management', {
                title: 'Products - Jaysam Enterprise',
                timberTypes: [],
                featuredProducts: [],
                messages: req.flash()
            });
        }
    },

    // Get size variants for a specific timber type (API endpoint)
    getSizeVariants: async (req, res) => {
        try {
            const { timberType } = req.params;
            const sizeVariants = await productModel.getSizeVariantsByTimberType(timberType);
            
            res.json({
                success: true,
                timberType: timberType,
                variants: sizeVariants
            });
        } catch (error) {
            console.error('Get size variants error:', error);
            res.status(500).json({
                success: false,
                error: 'Error loading size variants'
            });
        }
    },

    // Calculate price based on product and quantity (API endpoint)
    calculatePrice: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            
            if (!productId || !quantity) {
                return res.status(400).json({
                    success: false,
                    error: 'Product ID and quantity are required'
                });
            }

            const priceCalculation = await productModel.calculateProductPrice(productId, quantity);
            
            if (priceCalculation.error) {
                return res.status(400).json({
                    success: false,
                    error: priceCalculation.error
                });
            }

            res.json({
                success: true,
                ...priceCalculation
            });
        } catch (error) {
            console.error('Calculate price error:', error);
            res.status(500).json({
                success: false,
                error: 'Error calculating price'
            });
        }
    },

    // Get featured products for carousel (API endpoint)
    getFeaturedProductsAPI: async (req, res) => {
        try {
            const featuredProducts = await productModel.getFeaturedProducts();
            res.json({
                success: true,
                featuredProducts: featuredProducts
            });
        } catch (error) {
            console.error('Get featured products error:', error);
            res.status(500).json({
                success: false,
                error: 'Error loading featured products'
            });
        }
    },

    // Get product by ID (for compatibility)
    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await productModel.getProductById(id);

            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/products');
            }

            res.render('products/details', {
                title: 'Product Details - Jaysam Enterprise',
                product: product,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Get product by ID error:', error);
            req.flash('error', 'Error loading product');
            res.redirect('/products');
        }
    },

    // Existing methods (updated for compatibility)
    getTimberTypes: async (req, res) => {
        try {
            const timberTypes = await productModel.getAllTimberTypes();
            const uniqueTypes = [...new Set(timberTypes.map(t => t.timber_type))];
            res.json({ timberTypes: uniqueTypes });
        } catch (error) {
            console.error('Get timber types error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    getGrades: async (req, res) => {
        try {
            // This would need to be updated to get from all products
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
                product_name, timber_type, product_category = 'Timber', product_grade, dimensions, 
                thickness, width, length, price_per_unit, unit = 'piece', 
                quantity_in_stock, product_description, product_image
            } = req.body;

            await db.query(
                `INSERT INTO products (
                    product_name, timber_type, product_category, product_grade, dimensions, 
                    thickness, width, length, price_per_unit, unit, 
                    quantity_in_stock, product_description, product_image
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    product_name, timber_type, product_category, product_grade, dimensions,
                    thickness, width, length, price_per_unit, unit,
                    quantity_in_stock, product_description, product_image
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

    updateProduct: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(err => err.msg).join(', '));
                return res.redirect('/products');
            }

            const { id } = req.params;
            const {
                product_name, timber_type, product_category, product_grade, dimensions,
                thickness, width, length, price_per_unit, unit,
                quantity_in_stock, product_description, product_image
            } = req.body;

            const result = await db.query(
                `UPDATE products SET 
                    product_name = $1, timber_type = $2, product_category = $3, product_grade = $4, 
                    dimensions = $5, thickness = $6, width = $7, length = $8, 
                    price_per_unit = $9, unit = $10, quantity_in_stock = $11, 
                    product_description = $12, product_image = $13
                WHERE product_id = $14 AND is_active = true
                RETURNING *`,
                [
                    product_name, timber_type, product_category, product_grade, dimensions,
                    thickness, width, length, price_per_unit, unit,
                    quantity_in_stock, product_description, product_image, id
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

    // Debug method
    debugProducts: async (req, res) => {
        try {
            const timberTypes = await productModel.getAllTimberTypes();
            const featuredProducts = await productModel.getFeaturedProducts();
            
            res.json({
                success: true,
                timberTypesCount: timberTypes.length,
                featuredProductsCount: featuredProducts.length,
                timberTypes: timberTypes.slice(0, 3),
                featuredProducts: featuredProducts.slice(0, 3)
            });
        } catch (error) {
            res.json({ success: false, error: error.message });
        }
    }
};

module.exports = productController;