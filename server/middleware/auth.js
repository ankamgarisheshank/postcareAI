const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for Bearer token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - no token provided',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach doctor to request
        const doctor = await Doctor.findById(decoded.id);
        if (!doctor) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - doctor not found',
            });
        }

        req.doctor = doctor;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized - invalid token',
        });
    }
};

/**
 * Role-based access control
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.doctor.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.doctor.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
