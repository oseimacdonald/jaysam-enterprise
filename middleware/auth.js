const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const result = await db.query(
            'SELECT id, username, email, role, full_name FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {});
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin rights required.' });
        }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed.' });
    }
};

module.exports = { auth, adminAuth };