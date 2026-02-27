const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Convert front-end frequency object ({ morning: true, afternoon: false, evening: true })
 * into a scheduleTimes array and a human-readable frequency string.
 */
function parseFrequency(freq) {
    if (typeof freq === 'object' && freq !== null && !Array.isArray(freq)) {
        const times = [];
        if (freq.morning) times.push('morning');
        if (freq.afternoon) times.push('afternoon');
        if (freq.evening) times.push('evening');
        const label = times.length === 3 ? 'Three times daily' : times.length === 2 ? 'Twice daily' : times.length === 1 ? 'Once daily' : 'As needed';
        return { scheduleTimes: times, frequency: label };
    }
    // Already a string (e.g. from bulk/OCR)
    const timeMap = { 'once daily': ['morning'], 'twice daily': ['morning', 'evening'], 'three times daily': ['morning', 'afternoon', 'evening'], 'thrice daily': ['morning', 'afternoon', 'evening'] };
    const lower = (typeof freq === 'string' ? freq : '').toLowerCase();
    const scheduleTimes = timeMap[lower] || ['morning'];
    return { scheduleTimes, frequency: typeof freq === 'string' ? freq : 'Once daily' };
}

const addMedication = asyncHandler(async (req, res) => {
    const { patient: patientId, patientId: pId, drugName, medicineName, frequency, foodInstruction, ...medData } = req.body;
    const targetId = patientId || pId;
    const pat = await Patient.findOne({ _id: targetId, doctor: req.user._id });
    if (!pat) { res.status(404); throw new Error('Patient not found'); }

    const { scheduleTimes, frequency: freqLabel } = parseFrequency(frequency);

    const prescription = await Prescription.create({
        ...medData,
        patientId: targetId,
        doctor: req.user._id,
        drugName: drugName || medicineName,
        frequency: freqLabel,
        scheduleTimes,
        instructions: foodInstruction || medData.instructions || '',
        startDate: medData.startDate || new Date(),
        endDate: medData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ success: true, data: prescription });
});

const getMedications = asyncHandler(async (req, res) => {
    // Allow both doctor and patient to view medications
    const medications = await Prescription.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, data: medications });
});

const updateMedication = asyncHandler(async (req, res) => {
    let med = await Prescription.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!med) { res.status(404); throw new Error('Medication not found'); }
    // If frequency object is sent, parse it
    if (req.body.frequency && typeof req.body.frequency === 'object') {
        const { scheduleTimes, frequency } = parseFrequency(req.body.frequency);
        req.body.scheduleTimes = scheduleTimes;
        req.body.frequency = frequency;
    }
    if (req.body.foodInstruction) { req.body.instructions = req.body.foodInstruction; delete req.body.foodInstruction; }
    med = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: med });
});

const deleteMedication = asyncHandler(async (req, res) => {
    const med = await Prescription.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!med) { res.status(404); throw new Error('Medication not found'); }
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Medication deleted successfully' });
});

const bulkAddMedications = asyncHandler(async (req, res) => {
    const { patientId, medications } = req.body;
    const pat = await Patient.findOne({ _id: patientId, doctor: req.user._id });
    if (!pat) { res.status(404); throw new Error('Patient not found'); }
    const medsToCreate = medications.map((med) => {
        const { scheduleTimes, frequency } = parseFrequency(med.frequency);
        return {
            patientId,
            doctor: req.user._id,
            drugName: med.drugName || med.medicineName,
            dosage: med.dosage,
            frequency,
            scheduleTimes,
            instructions: med.foodInstruction || med.instructions || '',
            startDate: med.startDate || new Date(),
            endDate: med.endDate || new Date(Date.now() + (parseInt(med.duration) || 30) * 24 * 60 * 60 * 1000),
        };
    });
    const created = await Prescription.insertMany(medsToCreate);
    res.status(201).json({ success: true, data: created, count: created.length });
});

module.exports = { addMedication, getMedications, updateMedication, deleteMedication, bulkAddMedications };
