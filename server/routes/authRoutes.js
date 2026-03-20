const express = require('express');
const router = express.Router();
const { registerDoctor, registerPatient, loginDoctor, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerDoctor);
router.post('/register/patient', registerPatient);
router.post('/login', loginDoctor);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

module.exports = router;
