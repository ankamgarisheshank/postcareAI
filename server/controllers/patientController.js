const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const RecoveryLog = require('../models/RecoveryLog');
const Alert = require('../models/Alert');
const NutritionSchedule = require('../models/NutritionSchedule');
const { asyncHandler } = require('../middleware/errorHandler');
const { parsePrescription } = require('../services/geminiService');
const { sendWhatsAppMessage } = require('../services/twilioService');

/**
 * @desc    Create a new patient
 * @route   POST /api/patients
 * @access  Private
 */
const createPatient = asyncHandler(async (req, res) => {
    const patientData = {
        ...req.body,
        doctor: req.doctor._id,
    };

    const patient = await Patient.create(patientData);

    res.status(201).json({
        success: true,
        data: patient,
    });
});

/**
 * @desc    Get all patients for logged-in doctor
 * @route   GET /api/patients
 * @access  Private
 */
const getPatients = asyncHandler(async (req, res) => {
    const { status, riskLevel, search, page = 1, limit = 20 } = req.query;

    const query = { doctor: req.doctor._id };

    // Filters
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;
    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { diagnosis: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: patients,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        },
    });
});

/**
 * @desc    Get single patient by ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    // Fetch related data
    const [medications, recoveryLogs, alerts, nutritionSchedule] = await Promise.all([
        Medication.find({ patient: patient._id }).sort({ createdAt: -1 }),
        RecoveryLog.find({ patient: patient._id }).sort({ date: -1 }).limit(30),
        Alert.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(20),
        NutritionSchedule.findOne({ patient: patient._id, isActive: true }),
    ]);

    res.json({
        success: true,
        data: {
            ...patient.toObject(),
            medications,
            recoveryLogs,
            alerts,
            nutritionSchedule,
        },
    });
});

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
const updatePatient = asyncHandler(async (req, res) => {
    let patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.json({
        success: true,
        data: patient,
    });
});

/**
 * @desc    Delete patient
 * @route   DELETE /api/patients/:id
 * @access  Private
 */
const deletePatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    // Delete related data
    await Promise.all([
        Medication.deleteMany({ patient: patient._id }),
        RecoveryLog.deleteMany({ patient: patient._id }),
        Alert.deleteMany({ patient: patient._id }),
        NutritionSchedule.deleteMany({ patient: patient._id }),
        Patient.findByIdAndDelete(patient._id),
    ]);

    res.json({
        success: true,
        message: 'Patient and related data deleted successfully',
    });
});

/**
 * @desc    Upload prescription and parse with Gemini
 * @route   POST /api/patients/:id/prescription
 * @access  Private
 */
const uploadPrescription = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a prescription file');
    }

    // Save file path to patient
    patient.prescriptionFile = req.file.path;
    await patient.save();

    // Parse prescription with Gemini
    let parsedMedications = [];
    try {
        parsedMedications = await parsePrescription(req.file.path);
    } catch (error) {
        console.error('Prescription parsing failed:', error.message);
    }

    res.json({
        success: true,
        data: {
            filePath: req.file.path,
            fileName: req.file.filename,
            parsedMedications,
        },
    });
});

/**
 * @desc    Send emergency alert for patient
 * @route   POST /api/patients/:id/emergency
 * @access  Private
 */
const sendEmergency = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const { message } = req.body;

    // Create high-severity alert
    const alert = await Alert.create({
        patient: patient._id,
        doctor: req.doctor._id,
        severity: 'High',
        message: message || 'Emergency alert triggered by doctor',
        type: 'emergency',
    });

    // Update patient status
    patient.status = 'Critical';
    patient.riskLevel = 'High';
    await patient.save();

    // Send WhatsApp notification
    await sendWhatsAppMessage(
        patient.phone,
        `🚨 *EMERGENCY ALERT*\n\nDear ${patient.fullName},\n\nYour doctor has flagged an emergency. Please contact the hospital immediately.\n\n📞 This is urgent.\n\n_PostCare AI Emergency System_`
    );

    res.status(201).json({
        success: true,
        data: alert,
    });
});

module.exports = {
    createPatient,
    getPatients,
    getPatient,
    updatePatient,
    deletePatient,
    uploadPrescription,
    sendEmergency,
};
