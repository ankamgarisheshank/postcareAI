const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register a new doctor
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerDoctor = asyncHandler(async (req, res) => {
    const { fullName, email, password, specialization, phone, hospital } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
        res.status(400);
        throw new Error('Doctor with this email already exists');
    }

    // Create doctor
    const doctor = await Doctor.create({
        fullName,
        email,
        password,
        specialization,
        phone,
        hospital,
    });

    // Generate token
    const token = generateToken(doctor._id);

    res.status(201).json({
        success: true,
        data: {
            _id: doctor._id,
            fullName: doctor.fullName,
            email: doctor.email,
            specialization: doctor.specialization,
            phone: doctor.phone,
            hospital: doctor.hospital,
            role: doctor.role,
            token,
        },
    });
});

/**
 * @desc    Login doctor
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Find doctor with password
    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await doctor.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(doctor._id);

    res.json({
        success: true,
        data: {
            _id: doctor._id,
            fullName: doctor.fullName,
            email: doctor.email,
            specialization: doctor.specialization,
            phone: doctor.phone,
            hospital: doctor.hospital,
            role: doctor.role,
            token,
        },
    });
});

/**
 * @desc    Get current doctor profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.doctor._id);
    res.json({
        success: true,
        data: doctor,
    });
});

/**
 * @desc    Update doctor profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, specialization, phone, hospital } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
        req.doctor._id,
        { fullName, specialization, phone, hospital },
        { new: true, runValidators: true }
    );

    res.json({
        success: true,
        data: doctor,
    });
});

module.exports = { registerDoctor, loginDoctor, getMe, updateProfile };
