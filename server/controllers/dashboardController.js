const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const DailyLog = require('../models/DailyLog');
const Alert = require('../models/Alert');
const { asyncHandler } = require('../middleware/errorHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const patientIds = await Patient.find({ doctor: doctorId }).distinct('_id');

    const [totalPatients, activeCases, highRiskAlerts, todaysFollowUps, recentAlerts, statusBreakdown, recentPatients] =
        await Promise.all([
            Patient.countDocuments({ doctor: doctorId }),
            Patient.countDocuments({ doctor: doctorId, status: 'Active' }),
            Alert.countDocuments({ doctor: doctorId, severity: 'high', resolved: false }),
            DailyLog.countDocuments({ patientId: { $in: patientIds }, date: { $gte: today, $lt: tomorrow } }),
            Alert.find({ doctor: doctorId, resolved: false }).populate('patientId', 'name phone').sort({ createdAt: -1 }).limit(5),
            Patient.aggregate([{ $match: { doctor: doctorId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            Patient.find({ doctor: doctorId }).sort({ createdAt: -1 }).limit(5).select('name status riskLevel riskStatus recoveryScore diagnosis'),
        ]);

    // Map recentAlerts to backward-compat shape
    const alertsData = recentAlerts.map((a) => {
        const obj = a.toObject();
        obj.patient = obj.patientId;
        if (obj.patient) obj.patient.fullName = obj.patient.name;
        return obj;
    });

    // Map recentPatients to include fullName
    const patientsData = recentPatients.map((p) => ({ ...p.toObject(), fullName: p.name }));

    // Recovery trend - last 7 days
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recoveryTrend = await DailyLog.aggregate([
        { $match: { patientId: { $in: patientIds }, date: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, avgPain: { $avg: '$painLevel' }, totalLogs: { $sum: 1 }, adherenceCount: { $sum: { $cond: ['$medicineAdherence', 1, 0] } } } },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            stats: { totalPatients, activeCases, highRiskAlerts, todaysFollowUps },
            statusBreakdown, recentAlerts: alertsData, recentPatients: patientsData, recoveryTrend,
        },
    });
});

module.exports = { getDashboardStats };
