const Medication = require('../models/Medication');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Add medication
 * @route   POST /api/medications
 * @access  Private
 */
const addMedication = asyncHandler(async (req, res) => {
    const { patient: patientId, ...medData } = req.body;

    // Verify patient belongs to doctor
    const patient = await Patient.findOne({
        _id: patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const medication = await Medication.create({
        ...medData,
        patient: patientId,
        doctor: req.doctor._id,
    });

    res.status(201).json({
        success: true,
        data: medication,
    });
});

/**
 * @desc    Get medications for a patient
 * @route   GET /api/medications/:patientId
 * @access  Private
 */
const getMedications = asyncHandler(async (req, res) => {
    // Verify patient belongs to doctor
    const patient = await Patient.findOne({
        _id: req.params.patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const medications = await Medication.find({
        patient: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json({
        success: true,
        data: medications,
    });
});

/**
 * @desc    Update medication
 * @route   PUT /api/medications/:id
 * @access  Private
 */
const updateMedication = asyncHandler(async (req, res) => {
    let medication = await Medication.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!medication) {
        res.status(404);
        throw new Error('Medication not found');
    }

    medication = await Medication.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.json({
        success: true,
        data: medication,
    });
});

/**
 * @desc    Delete medication
 * @route   DELETE /api/medications/:id
 * @access  Private
 */
const deleteMedication = asyncHandler(async (req, res) => {
    const medication = await Medication.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!medication) {
        res.status(404);
        throw new Error('Medication not found');
    }

    await Medication.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: 'Medication deleted successfully',
    });
});

/**
 * @desc    Bulk add medications (from prescription parsing)
 * @route   POST /api/medications/bulk
 * @access  Private
 */
const bulkAddMedications = asyncHandler(async (req, res) => {
    const { patientId, medications } = req.body;

    // Verify patient belongs to doctor
    const patient = await Patient.findOne({
        _id: patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const medsToCreate = medications.map((med) => ({
        ...med,
        patient: patientId,
        doctor: req.doctor._id,
        startDate: med.startDate || new Date(),
        endDate: med.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    }));

    const created = await Medication.insertMany(medsToCreate);

    res.status(201).json({
        success: true,
        data: created,
        count: created.length,
    });
});

module.exports = {
    addMedication,
    getMedications,
    updateMedication,
    deleteMedication,
    bulkAddMedications,
};
