const Alert = require('../models/Alert');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all alerts for logged-in doctor
 * @route   GET /api/alerts
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
    const { resolved, severity, page = 1, limit = 50 } = req.query;

    const query = { doctor: req.doctor._id };
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (severity) query.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Alert.countDocuments(query);

    const alerts = await Alert.find(query)
        .populate('patient', 'fullName phone status riskLevel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: alerts,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        },
    });
});

/**
 * @desc    Resolve an alert
 * @route   PUT /api/alerts/:id/resolve
 * @access  Private
 */
const resolveAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findOne({
        _id: req.params.id,
        doctor: req.doctor._id,
    });

    if (!alert) {
        res.status(404);
        throw new Error('Alert not found');
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.doctor._id;
    await alert.save();

    res.json({
        success: true,
        data: alert,
    });
});

/**
 * @desc    Get alert statistics
 * @route   GET /api/alerts/stats
 * @access  Private
 */
const getAlertStats = asyncHandler(async (req, res) => {
    const stats = await Alert.aggregate([
        { $match: { doctor: req.doctor._id } },
        {
            $group: {
                _id: '$severity',
                total: { $sum: 1 },
                unresolved: {
                    $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] },
                },
            },
        },
    ]);

    const totalUnresolved = await Alert.countDocuments({
        doctor: req.doctor._id,
        resolved: false,
    });

    res.json({
        success: true,
        data: {
            bysSeverity: stats,
            totalUnresolved,
        },
    });
});

module.exports = { getAlerts, resolveAlert, getAlertStats };
