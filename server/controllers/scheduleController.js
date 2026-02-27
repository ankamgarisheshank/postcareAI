const CallSchedule = require('../models/CallSchedule');
const Patient = require('../models/Patient');
const { createOutboundCall } = require('../services/vapiService');
const { asyncHandler } = require('../middleware/errorHandler');

const createSchedule = asyncHandler(async (req, res) => {
    const { patientId, scheduledAt, message } = req.body;

    if (!patientId || !scheduledAt || !message) {
        return res.status(400).json({ success: false, message: 'patientId, scheduledAt, and message are required' });
    }

    const patient = await Patient.findOne({ _id: patientId, doctor: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (!patient.phone) {
        return res.status(400).json({ success: false, message: 'Patient has no phone number' });
    }

    const schedule = await CallSchedule.create({
        patientId,
        doctor: req.user._id,
        scheduledAt: new Date(scheduledAt),
        message: message.trim(),
    });

    res.status(201).json({ success: true, data: schedule });
});

const getSchedules = asyncHandler(async (req, res) => {
    const { patientId, status } = req.query;
    const query = { doctor: req.user._id };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const schedules = await CallSchedule.find(query)
        .populate('patientId', 'name fullName phone')
        .sort({ scheduledAt: 1 });

    res.json({ success: true, data: schedules });
});

const cancelSchedule = asyncHandler(async (req, res) => {
    const schedule = await CallSchedule.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (schedule.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending schedules can be cancelled' });
    }

    schedule.status = 'cancelled';
    await schedule.save();
    res.json({ success: true, data: schedule });
});

const testCall = asyncHandler(async (req, res) => {
    const { patientId, message } = req.body;

    if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const patient = await Patient.findOne({ _id: patientId, doctor: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (!patient.phone) {
        return res.status(400).json({ success: false, message: 'Patient has no phone number' });
    }

    const result = await createOutboundCall(
        patient.phone,
        patient.name || patient.fullName,
        message || 'This is a test call from PostCare AI. Your doctor is checking the voice assistant.'
    );

    if (result.success) {
        return res.json({ success: true, message: 'Call initiated! The patient should receive the call shortly.', data: result.data });
    }

    res.status(400).json({
        success: false,
        message: result.error || 'Call failed',
        hint: !process.env.VAPI_PHONE_NUMBER_ID
            ? 'Add VAPI_PHONE_NUMBER_ID to server/.env — get it from VAPI Dashboard → Phone Numbers'
            : undefined,
    });
});

module.exports = { createSchedule, getSchedules, cancelSchedule, testCall };
