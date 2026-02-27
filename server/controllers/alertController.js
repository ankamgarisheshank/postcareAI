const Alert = require('../models/Alert');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

const getAlerts = asyncHandler(async (req, res) => {
    const { resolved, severity, page = 1, limit = 50 } = req.query;

    // Find all patients that belong to this doctor (by ObjectId or doctorPhone)
    const patientMatch = { $or: [{ doctor: req.user._id }] };
    if (req.user.phone) patientMatch.$or.push({ doctorPhone: req.user.phone });
    const patientIds = (await Patient.find(patientMatch).select('_id')).map(p => p._id);

    // Match alerts by doctor field OR by patientId belonging to this doctor
    const query = { $or: [{ doctor: req.user._id }, { patientId: { $in: patientIds } }] };
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (severity) query.severity = severity.toLowerCase();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Alert.countDocuments(query);
    const alerts = await Alert.find(query)
        .populate('patientId', 'name phone status riskLevel riskStatus')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    // Add backward compat: map patientId to patient for client
    const alertsData = alerts.map((a) => {
        const obj = a.toObject();
        obj.patient = obj.patientId;
        return obj;
    });
    res.json({ success: true, data: alertsData, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

const resolveAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!alert) { res.status(404); throw new Error('Alert not found'); }
    alert.resolved = true;
    alert.isRead = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    await alert.save();
    res.json({ success: true, data: alert });
});

const getAlertStats = asyncHandler(async (req, res) => {
    const stats = await Alert.aggregate([
        { $match: { doctor: req.user._id } },
        { $group: { _id: '$severity', total: { $sum: 1 }, unresolved: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } } } },
    ]);
    const totalUnresolved = await Alert.countDocuments({ doctor: req.user._id, resolved: false });
    res.json({ success: true, data: { bySeverity: stats, totalUnresolved } });
});

module.exports = { getAlerts, resolveAlert, getAlertStats };
