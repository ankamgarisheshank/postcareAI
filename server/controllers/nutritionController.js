const NutritionSchedule = require('../models/NutritionSchedule');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

const setNutritionSchedule = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    await NutritionSchedule.updateMany({ patient: patient._id, isActive: true }, { isActive: false });
    const schedule = await NutritionSchedule.create({ ...req.body, patient: patient._id, doctor: req.user._id });
    res.status(201).json({ success: true, data: schedule });
});

const getNutritionSchedule = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const schedule = await NutritionSchedule.findOne({ patient: patient._id, isActive: true });
    res.json({ success: true, data: schedule });
});

module.exports = { setNutritionSchedule, getNutritionSchedule };
