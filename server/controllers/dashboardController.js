const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const RecoveryLog = require('../models/RecoveryLog');
const Alert = require('../models/Alert');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const doctorId = req.doctor._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel
    const [
        totalPatients,
        activeCases,
        highRiskAlerts,
        todaysFollowUps,
        recentAlerts,
        statusBreakdown,
        recentPatients,
    ] = await Promise.all([
        Patient.countDocuments({ doctor: doctorId }),
        Patient.countDocuments({ doctor: doctorId, status: 'Active' }),
        Alert.countDocuments({ doctor: doctorId, severity: 'High', resolved: false }),
        RecoveryLog.countDocuments({
            patient: { $in: await Patient.find({ doctor: doctorId }).distinct('_id') },
            date: { $gte: today, $lt: tomorrow },
        }),
        Alert.find({ doctor: doctorId, resolved: false })
            .populate('patient', 'fullName phone')
            .sort({ createdAt: -1 })
            .limit(5),
        Patient.aggregate([
            { $match: { doctor: doctorId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Patient.find({ doctor: doctorId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName status riskLevel recoveryScore diagnosis'),
    ]);

    // Recovery analytics - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const patientIds = await Patient.find({ doctor: doctorId }).distinct('_id');

    const recoveryTrend = await RecoveryLog.aggregate([
        {
            $match: {
                patient: { $in: patientIds },
                date: { $gte: sevenDaysAgo },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                avgPain: { $avg: '$painLevel' },
                totalLogs: { $sum: 1 },
                adherenceCount: {
                    $sum: { $cond: ['$medicineAdherence', 1, 0] },
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            stats: {
                totalPatients,
                activeCases,
                highRiskAlerts,
                todaysFollowUps,
            },
            statusBreakdown,
            recentAlerts,
            recentPatients,
            recoveryTrend,
        },
    });
});

module.exports = { getDashboardStats };
