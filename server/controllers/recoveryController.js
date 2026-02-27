const DailyLog = require('../models/DailyLog');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

const addRecoveryLog = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const log = await DailyLog.create({ ...req.body, patientId: req.params.patientId });
    // Update patient recovery score from last 7 logs
    const recentLogs = await DailyLog.find({ patientId: patient._id }).sort({ date: -1 }).limit(7);
    if (recentLogs.length > 0) {
        const avgPain = recentLogs.reduce((sum, l) => sum + l.painLevel, 0) / recentLogs.length;
        const adherenceRate = recentLogs.filter((l) => l.medicineAdherence).length / recentLogs.length;
        const recoveryScore = Math.round((1 - avgPain / 10) * 50 + adherenceRate * 50);
        patient.recoveryScore = Math.min(100, Math.max(0, recoveryScore));
        await patient.save();
    }
    res.status(201).json({ success: true, data: log });
});

const getRecoveryLogs = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctor: req.user._id });
    if (!patient) { res.status(404); throw new Error('Patient not found'); }
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const logs = await DailyLog.find({ patientId: req.params.patientId, date: { $gte: startDate } }).sort({ date: -1 });
    const totalLogs = logs.length;
    const avgPain = totalLogs > 0 ? logs.reduce((sum, l) => sum + l.painLevel, 0) / totalLogs : 0;
    const adherenceRate = totalLogs > 0 ? (logs.filter((l) => l.medicineAdherence).length / totalLogs) * 100 : 0;
    const symptomMap = {};
    logs.forEach((l) => { l.symptoms.forEach((s) => { symptomMap[s] = (symptomMap[s] || 0) + 1; }); });
    res.json({
        success: true,
        data: {
            logs,
            analytics: {
                totalLogs,
                avgPain: Math.round(avgPain * 10) / 10,
                adherenceRate: Math.round(adherenceRate),
                symptomFrequency: symptomMap,
                recoveryScore: patient.recoveryScore,
            },
        },
    });
});

module.exports = { addRecoveryLog, getRecoveryLogs };
