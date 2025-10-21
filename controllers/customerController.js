const db = require('../database/databaseConnection');

const customerController = {
    getAllCustomers: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM customers ORDER BY created_date DESC'); // Changed to created_date
            
            res.render('customers/management', {
                title: 'Customer Management - Jaysam Enterprise',
                customers: result.rows,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Get customers error:', error);
            req.flash('error', 'Error loading customers');
            res.redirect('/');
        }
    },

    createCustomer: async (req, res) => {
        try {
            const { company_name, contact_person, contact_email, contact_phone, address, tax_number, payment_terms, credit_limit } = req.body; // Changed to contact_email, contact_phone
            
            const result = await db.query(
                `INSERT INTO customers (company_name, contact_person, contact_email, contact_phone, address, tax_number, payment_terms, credit_limit) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, // Updated column names
                [company_name, contact_person, contact_email, contact_phone, address, tax_number, payment_terms, credit_limit]
            );

            req.flash('success', 'Customer created successfully');
            res.redirect('/customers');
        } catch (error) {
            console.error('Create customer error:', error);
            req.flash('error', 'Error creating customer');
            res.redirect('/customers');
        }
    }
};

module.exports = customerController;