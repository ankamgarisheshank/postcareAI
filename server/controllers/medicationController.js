const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

const addMedication = asyncHandler(async (req, res) => {
    const { patient: patientId, patientId: pId, drugName, medicineName, ...medData } = req.body;
    const targetId = patientId || pId;
    const pat = await Patient.findOne({ _id: targetId, doctor: req.user._id });
    if (!pat) { res.status(404); throw new Error('Patient not found'); }
    const prescription = await Prescription.create({
        ...medData,
        patientId: targetId,
        doctor: req.user._id,
        drugName: drugName || medicineName,
        startDate: medData.startDate || new Date(),
        endDate: medData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ success: true, data: prescription });
});

const getMedications = asyncHandler(async (req, res) => {
    const pat = await Patient.findOne({ _id: req.params.patientId, doctor: req.user._id });
    if (!pat) { res.status(404); throw new Error('Patient not found'); }
    const medications = await Prescription.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, data: medications });
});

const updateMedication = asyncHandler(async (req, res) => {
    let med = await Prescription.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!med) { res.status(404); throw new Error('Medication not found'); }
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
    const medsToCreate = medications.map((med) => ({
        patientId: patientId,
        doctor: req.user._id,
        drugName: med.drugName || med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency || 'Once daily',
        instructions: med.foodInstruction || med.instructions || '',
        startDate: med.startDate || new Date(),
        endDate: med.endDate || new Date(Date.now() + (parseInt(med.duration) || 30) * 24 * 60 * 60 * 1000),
    }));
    const created = await Prescription.insertMany(medsToCreate);
    res.status(201).json({ success: true, data: created, count: created.length });
});

module.exports = { addMedication, getMedications, updateMedication, deleteMedication, bulkAddMedications };
