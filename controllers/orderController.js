const db = require('../config/database');

const orderController = {
    getAllOrders: async (req, res) => {
        try {
            const result = await db.query(`
                SELECT o.*, c.company_name, c.contact_person 
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id 
                ORDER BY o.created_at DESC
                LIMIT 50
            `);
            res.json({ orders: result.rows });
        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    createOrder: async (req, res) => {
        try {
            const { customer_id, order_date, delivery_date, notes, items } = req.body;
            
            // Generate order number
            const orderNumber = 'ORD-' + Date.now();
            
            // Calculate total amount
            const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            
            const orderResult = await db.query(
                `INSERT INTO orders (order_number, customer_id, order_date, delivery_date, notes, total_amount, created_by) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [orderNumber, customer_id, order_date, delivery_date, notes, total_amount, req.user.id]
            );

            // Insert order items
            for (const item of items) {
                await db.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderResult.rows[0].id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
                );
            }

            res.status(201).json({ order: orderResult.rows[0] });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = orderController;