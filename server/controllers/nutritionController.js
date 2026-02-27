const NutritionSchedule = require('../models/NutritionSchedule');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Add/Update nutrition schedule for patient
 * @route   POST /api/nutrition/:patientId
 * @access  Private
 */
const setNutritionSchedule = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    // Deactivate existing schedule
    await NutritionSchedule.updateMany(
        { patient: patient._id, isActive: true },
        { isActive: false }
    );

    const schedule = await NutritionSchedule.create({
        ...req.body,
        patient: patient._id,
        doctor: req.doctor._id,
    });

    res.status(201).json({
        success: true,
        data: schedule,
    });
});

/**
 * @desc    Get nutrition schedule for patient
 * @route   GET /api/nutrition/:patientId
 * @access  Private
 */
const getNutritionSchedule = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const schedule = await NutritionSchedule.findOne({
        patient: patient._id,
        isActive: true,
    });

    res.json({
        success: true,
        data: schedule,
    });
});

module.exports = { setNutritionSchedule, getNutritionSchedule };
