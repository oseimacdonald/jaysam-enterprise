const db = require('../config/database');

const customerController = {
    getAllCustomers: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
            res.json({ customers: result.rows });
        } catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    createCustomer: async (req, res) => {
        try {
            const { company_name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit } = req.body;
            
            const result = await db.query(
                `INSERT INTO customers (company_name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [company_name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit]
            );

            res.status(201).json({ customer: result.rows[0] });
        } catch (error) {
            console.error('Create customer error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = customerController;