const CallLog = require('../models/CallLog');
const { asyncHandler } = require('../middleware/errorHandler');

const getCallLogs = asyncHandler(async (req, res) => {
    const { patientId, limit = 50 } = req.query;
    const query = { doctor: req.user._id };
    if (patientId) query.patientId = patientId;

    const logs = await CallLog.find(query)
        .populate('patientId', 'name fullName phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10));

    res.json({ success: true, data: logs });
});

module.exports = { getCallLogs };
