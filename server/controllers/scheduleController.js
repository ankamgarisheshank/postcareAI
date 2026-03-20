const CallSchedule = require('../models/CallSchedule');
const Patient = require('../models/Patient');
const { createOutboundCall } = require('../services/vapiService');
const { translateMessage } = require('../services/translationService');
const { parseScheduleTime } = require('../services/scheduleParseService');
const { processScheduledCalls } = require('../services/schedulerService');
const { asyncHandler } = require('../middleware/errorHandler');

const parseTime = asyncHandler(async (req, res) => {
    const { input } = req.query;
    if (!input?.trim()) {
        return res.status(400).json({ success: false, message: 'input query param required (e.g. today 6:35 pm)' });
    }
    const result = await parseScheduleTime(input.trim());
    if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result });
});

const translatePreview = asyncHandler(async (req, res) => {
    const { message } = req.query;
    if (!message?.trim()) {
        return res.status(400).json({ success: false, message: 'message query param required' });
    }
    const translations = await translateMessage(message.trim());
    res.json({ success: true, data: translations });
});

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

    const translations = await translateMessage(message.trim());

    const schedule = await CallSchedule.create({
        patientId,
        doctor: req.user._id,
        scheduledAt: new Date(scheduledAt),
        message: message.trim(),
        englishMessage: translations.english,
        teluguMessage: translations.teluguMessage,
        hindiMessage: translations.hindiMessage,
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

    const translations = message?.trim()
        ? await translateMessage(message.trim())
        : { english: 'This is a test call from PostCare AI. Your doctor is checking the voice assistant.', teluguMessage: 'Idi PostCare AI test call. Mee doctor voice assistant ni check chestunnaru.', hindiMessage: 'Yeh PostCare AI ka test call hai. Aapke doctor voice assistant check kar rahe hain.' };

    const result = await createOutboundCall(
        patient.phone,
        patient.name || patient.fullName,
        translations
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

const processNow = asyncHandler(async (req, res) => {
    await processScheduledCalls();
    res.json({ success: true, message: 'Scheduler ran. Check server logs for results.' });
});

module.exports = { createSchedule, getSchedules, cancelSchedule, testCall, translatePreview, processNow, parseTime };
