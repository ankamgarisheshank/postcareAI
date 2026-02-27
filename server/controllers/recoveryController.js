const RecoveryLog = require('../models/RecoveryLog');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Add recovery log entry
 * @route   POST /api/recovery/:patientId
 * @access  Private
 */
const addRecoveryLog = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const log = await RecoveryLog.create({
        ...req.body,
        patient: req.params.patientId,
    });

    // Update patient recovery score based on latest logs
    const recentLogs = await RecoveryLog.find({ patient: patient._id })
        .sort({ date: -1 })
        .limit(7);

    if (recentLogs.length > 0) {
        const avgPain = recentLogs.reduce((sum, l) => sum + l.painLevel, 0) / recentLogs.length;
        const adherenceRate =
            recentLogs.filter((l) => l.medicineAdherence).length / recentLogs.length;
        const recoveryScore = Math.round((1 - avgPain / 10) * 50 + adherenceRate * 50);

        patient.recoveryScore = Math.min(100, Math.max(0, recoveryScore));
        await patient.save();
    }

    res.status(201).json({
        success: true,
        data: log,
    });
});

/**
 * @desc    Get recovery logs for a patient
 * @route   GET /api/recovery/:patientId
 * @access  Private
 */
const getRecoveryLogs = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.patientId,
        doctor: req.doctor._id,
    });

    if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await RecoveryLog.find({
        patient: req.params.patientId,
        date: { $gte: startDate },
    }).sort({ date: -1 });

    // Calculate analytics
    const totalLogs = logs.length;
    const avgPain = totalLogs > 0 ? logs.reduce((sum, l) => sum + l.painLevel, 0) / totalLogs : 0;
    const adherenceRate =
        totalLogs > 0 ? (logs.filter((l) => l.medicineAdherence).length / totalLogs) * 100 : 0;

    // Symptom frequency
    const symptomMap = {};
    logs.forEach((l) => {
        l.symptoms.forEach((s) => {
            symptomMap[s] = (symptomMap[s] || 0) + 1;
        });
    });

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
