const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register a new doctor
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerDoctor = asyncHandler(async (req, res) => {
    const { name, fullName, email, password, specialization, phone, hospital } = req.body;
    const userName = name || fullName;

    if (!email) {
        res.status(400);
        throw new Error('Email is required for doctor registration');
    }

    const existing = await User.findOne({ email });
    if (existing) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const user = await User.create({
        name: userName,
        email,
        password,
        phone,
        specialization,
        hospital,
        role: 'doctor',
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            fullName: user.name,
            email: user.email,
            specialization: user.specialization,
            phone: user.phone,
            hospital: user.hospital,
            role: user.role,
            token,
        },
    });
});

/**
 * @desc    Register a new patient
 * @route   POST /api/auth/register/patient
 * @access  Public
 */
const registerPatient = asyncHandler(async (req, res) => {
    const { name, phone, password, email } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Phone number is required for patient registration');
    }

    const existing = await User.findOne({ phone });
    if (existing) {
        res.status(400);
        throw new Error('User with this phone already exists');
    }

    const user = await User.create({
        name,
        phone,
        email,
        password,
        role: 'patient',
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            linkedPatientId: user.linkedPatientId,
            token,
        },
    });
});

/**
 * @desc    Login (supports email or phone)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginDoctor = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
        res.status(400);
        throw new Error('Please provide email/phone and password');
    }

    // Find by email or phone
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');
    if (!user) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id);

    res.json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            fullName: user.name,
            email: user.email,
            phone: user.phone,
            specialization: user.specialization,
            hospital: user.hospital,
            role: user.role,
            linkedPatientId: user.linkedPatientId,
            token,
        },
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        success: true,
        data: {
            ...user.toObject(),
            fullName: user.name, // backward compat
        },
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, fullName, specialization, phone, hospital } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name: name || fullName, specialization, phone, hospital },
        { new: true, runValidators: true }
    );

    res.json({
        success: true,
        data: {
            ...user.toObject(),
            fullName: user.name,
        },
    });
});

module.exports = { registerDoctor, registerPatient, loginDoctor, getMe, updateProfile };
