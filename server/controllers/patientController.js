const Patient = require('../models/Patient');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const DailyLog = require('../models/DailyLog');
const Alert = require('../models/Alert');
const NutritionSchedule = require('../models/NutritionSchedule');
const { asyncHandler } = require('../middleware/errorHandler');

const DEFAULT_PATIENT_PASSWORD = '123456';
const { parsePrescription } = require('../services/geminiService');
const { sendWhatsAppMessage } = require('../services/twilioService');

const geocodeAddress = async (address) => {
    try {
        if (!address) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'PostCareAI/1.0' } });
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), formattedAddress: data[0].display_name };
        }
    } catch (error) { console.error('Geocoding error:', error.message); }
    return null;
};

const createPatient = asyncHandler(async (req, res) => {
    const { fullName, ...rest } = req.body;
    const patientData = { ...rest, name: rest.name || fullName, doctor: req.user._id, assignedDoctor: req.user.name, doctorPhone: req.user.phone || '' };
    if (patientData.address) { const location = await geocodeAddress(patientData.address); if (location) patientData.location = location; }
    const patient = await Patient.create(patientData);

    // Auto-create patient login: username = phone, password = 123456
    const phone = (patient.phone || '').trim();
    if (phone) {
        let phoneNorm = phone;
        if (!phoneNorm.startsWith('+')) phoneNorm = phoneNorm.startsWith('0') ? '+91' + phoneNorm.slice(1) : '+91' + phoneNorm;
        const existingUser = await User.findOne({ $or: [{ phone: phoneNorm }, { phone }] });
        if (existingUser) {
            existingUser.linkedPatientId = patient._id;
            existingUser.name = patient.name;
            await existingUser.save();
        } else {
            await User.create({
                name: patient.name,
                phone: phoneNorm,
                password: DEFAULT_PATIENT_PASSWORD,
                role: 'patient',
                linkedPatientId: patient._id,
            });
        }
    }

    res.status(201).json({ success: true, data: patient });
});

const getPatients = asyncHandler(async (req, res) => {
    const { status, riskLevel, riskStatus, search, page = 1, limit = 20 } = req.query;
    // Match patients by doctor ObjectId OR by doctorPhone (for mobile-created patients)
    const doctorMatch = { $or: [{ doctor: req.user._id }] };
    if (req.user.phone) doctorMatch.$or.push({ doctorPhone: req.user.phone });
    const query = { ...doctorMatch };
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;
    if (riskStatus) query.riskStatus = riskStatus;
    if (search) { query.$and = [{ $or: [{ name: { $regex: search, $options: 'i' } }, { diagnosis: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }]; }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const patientsData = patients.map((p) => ({ ...p.toObject(), fullName: p.name }));
    res.json({ success: true, data: patientsData, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } });
});

const getPatient = asyncHandler(async (req, res) => {
    const matchConditions = [{ _id: req.params.id, doctor: req.user._id }];
    if (req.user.phone) matchConditions.push({ _id: req.params.id, doctorPhone: req.user.phone });
    const patient = await Patient.findOne({ $or: matchConditions }).populate('doctor', 'name phone specialization hospital');
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const [prescriptions, dailyLogs, alerts, nutritionSchedule] = await Promise.all([
        Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }),
        DailyLog.find({ patientId: patient._id }).sort({ date: -1 }).limit(30),
        Alert.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(20),
        NutritionSchedule.findOne({ patient: patient._id, isActive: true }),
    ]);
    res.json({ success: true, data: { ...patient.toObject(), fullName: patient.name, medications: prescriptions, prescriptions, recoveryLogs: dailyLogs, dailyLogs, alerts, nutritionSchedule } });
});

const updatePatient = asyncHandler(async (req, res) => {
    const matchConditions = [{ _id: req.params.id, doctor: req.user._id }];
    if (req.user.phone) matchConditions.push({ _id: req.params.id, doctorPhone: req.user.phone });
    let patient = await Patient.findOne({ $or: matchConditions });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const { fullName, ...rest } = req.body;
    const updateData = { ...rest };
    if (fullName && !rest.name) updateData.name = fullName;
    if (updateData.address && updateData.address !== patient.address) { const location = await geocodeAddress(updateData.address); if (location) updateData.location = location; }
    patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: { ...patient.toObject(), fullName: patient.name } });
});

const deletePatient = asyncHandler(async (req, res) => {
    const matchConditions = [{ _id: req.params.id, doctor: req.user._id }];
    if (req.user.phone) matchConditions.push({ _id: req.params.id, doctorPhone: req.user.phone });
    const patient = await Patient.findOne({ $or: matchConditions });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    await Promise.all([
        Prescription.deleteMany({ patientId: patient._id }),
        DailyLog.deleteMany({ patientId: patient._id }),
        Alert.deleteMany({ patientId: patient._id }),
        NutritionSchedule.deleteMany({ patient: patient._id }),
        Patient.findByIdAndDelete(patient._id),
    ]);
    res.json({ success: true, message: 'Patient and related data deleted successfully' });
});

const uploadPrescription = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    if (!req.file) { res.status(400); throw new Error('Please upload a prescription file'); }
    patient.prescriptionFile = req.file.path;
    await patient.save();
    let parsedMedications = [];
    try { parsedMedications = await parsePrescription(req.file.path); } catch (error) { console.error('Prescription parsing failed:', error.message); }
    res.json({ success: true, data: { filePath: req.file.path, fileName: req.file.filename, parsedMedications } });
});

const sendEmergency = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const { message } = req.body;
    const alert = await Alert.create({ patientId: patient._id, doctor: req.user._id, severity: 'high', title: 'Emergency Alert', message: message || 'Emergency alert triggered by doctor', type: 'emergency' });
    patient.status = 'Critical'; patient.riskLevel = 'High'; patient.riskStatus = 'critical'; await patient.save();
    try { await sendWhatsAppMessage(patient.phone, `Emergency ALERT - Dear ${patient.name}, your doctor has flagged an emergency. Please contact the hospital immediately. - PostCare AI`); } catch (err) { console.error('WhatsApp send failed:', err.message); }
    res.status(201).json({ success: true, data: alert });
});

/**
 * @desc    Get the logged-in patient's own data (no doctor-gating)
 * @route   GET /api/patients/me
 * @access  Private (patient)
 */
const getMyPatientData = asyncHandler(async (req, res) => {
    // Find by linkedPatientId first, then fall back to phone match
    let patient;
    if (req.user.linkedPatientId) {
        patient = await Patient.findById(req.user.linkedPatientId).populate('doctor', 'name phone specialization hospital');
    }
    if (!patient && req.user.phone) {
        patient = await Patient.findOne({ phone: req.user.phone }).populate('doctor', 'name phone specialization hospital');
        // Auto-link for future fast lookups
        if (patient) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user._id, { linkedPatientId: patient._id });
        }
    }
    if (!patient) {
        res.status(404);
        throw new Error('No patient record found for your account. Please ask your doctor to add you.');
    }

    const [prescriptions, dailyLogs, alerts, nutritionSchedule] = await Promise.all([
        Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }),
        DailyLog.find({ patientId: patient._id }).sort({ date: -1 }).limit(30),
        Alert.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(20),
        NutritionSchedule.findOne({ patient: patient._id, isActive: true }),
    ]);

    res.json({
        success: true,
        data: {
            ...patient.toObject(),
            fullName: patient.name,
            medications: prescriptions,
            prescriptions,
            recoveryLogs: dailyLogs,
            dailyLogs,
            alerts,
            nutritionSchedule,
        },
    });
});

module.exports = { createPatient, getPatients, getPatient, getMyPatientData, updatePatient, deletePatient, uploadPrescription, sendEmergency };
