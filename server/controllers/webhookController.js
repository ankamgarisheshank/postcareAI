const DailyLog = require('../models/DailyLog');
const Alert = require('../models/Alert');
const Patient = require('../models/Patient');
const CallLog = require('../models/CallLog');
const CallSchedule = require('../models/CallSchedule');
const { classifyMessage } = require('../services/geminiService');
const { summarizeCall } = require('../services/callSummaryService');
const { asyncHandler } = require('../middleware/errorHandler');

const handleWhatsAppWebhook = asyncHandler(async (req, res) => {
    const { Body: messageBody, From: fromNumber } = req.body;
    if (!messageBody || !fromNumber) {
        return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }
    const phone = fromNumber.replace('whatsapp:', '');
    const patient = await Patient.findOne({ phone: { $regex: phone.replace('+', '') } });
    if (!patient) {
        console.log('Unknown patient message from: ' + phone);
        return res.status(200).json({ success: true, message: 'Acknowledged' });
    }

    const classification = await classifyMessage(messageBody);

    let painLevel = 0;
    const painMatch = messageBody.match(/(\d+)/);
    if (painMatch) { const num = parseInt(painMatch[1]); if (num >= 0 && num <= 10) painLevel = num; }

    const lowerMsg = messageBody.toLowerCase();
    const medicineAdherence = lowerMsg.includes('taken') || lowerMsg.includes('yes') || lowerMsg.includes('done');

    const dailyLog = await DailyLog.create({
        patientId: patient._id,
        painLevel,
        message: messageBody,
        source: 'whatsapp',
        medicineAdherence,
        symptoms: classification.summary ? [classification.summary] : [],
        mood: classification.severity === 'High' ? 'bad' : classification.severity === 'Medium' ? 'okay' : 'good',
    });

    if (classification.severity === 'High' || classification.severity === 'Medium') {
        await Alert.create({
            patientId: patient._id,
            doctor: patient.doctor,
            severity: classification.severity.toLowerCase(),
            title: 'WhatsApp Alert',
            message: 'Patient replied: "' + messageBody + '" - AI Assessment: ' + classification.summary,
            type: 'symptom',
        });
        if (classification.severity === 'High') {
            patient.riskLevel = 'High';
            patient.riskStatus = 'critical';
            patient.status = 'Critical';
            await patient.save();
        }
    }

    res.set('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');
});

const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body || {};
        if (!message || message.type !== 'end-of-call-report') {
            return res.status(200).json({ received: true });
        }

        const callId = message.call?.id;
        const transcript = message.artifact?.transcript || '';
        const endedReason = message.endedReason || '';
        const recording = message.artifact?.recording;
        const recordingUrl = recording?.url || recording?.mp3Url || '';

        if (!callId) {
            return res.status(200).json({ received: true });
        }

        let callLog = await CallLog.findOne({ vapiCallId: callId });
        if (!callLog) {
            const schedule = await CallSchedule.findOne({ vapiCallId: callId }).populate('patientId');
            const customerNumber = message.call?.customer?.number || message.customer?.number || '';
            let patientId, doctorId, patientName, patientPhone, scheduledAt, messageText;
            if (schedule?.patientId) {
                patientId = schedule.patientId._id;
                doctorId = schedule.doctor;
                patientName = schedule.patientId.name || schedule.patientId.fullName;
                patientPhone = schedule.patientId.phone;
                scheduledAt = schedule.scheduledAt;
                messageText = schedule.englishMessage || schedule.message;
            } else if (customerNumber) {
                const patient = await Patient.findOne({ phone: { $regex: customerNumber.replace(/\D/g, '') } });
                if (patient) {
                    patientId = patient._id;
                    doctorId = patient.doctor;
                    patientName = patient.name || patient.fullName;
                    patientPhone = patient.phone;
                    messageText = '';
                }
            }
            if (patientId && doctorId) {
                callLog = await CallLog.create({
                    vapiCallId: callId,
                    scheduleId: schedule?._id,
                    patientId,
                    doctor: doctorId,
                    patientName,
                    patientPhone,
                    scheduledAt,
                    transcript,
                    endedReason,
                    recordingUrl,
                    message: messageText,
                    status: 'completed',
                    endedAt: new Date(),
                });
            } else {
                return res.status(200).json({ received: true });
            }
        } else {
            callLog.transcript = transcript;
            callLog.endedReason = endedReason;
            callLog.recordingUrl = recordingUrl || callLog.recordingUrl;
            callLog.status = 'completed';
            callLog.endedAt = new Date();
        }

        if (transcript?.trim()) {
            const summary = await summarizeCall(transcript, callLog.patientName);
            callLog.summary = summary;
        }
        await callLog.save();

        console.log(`📞 Call log updated: ${callId} → ${callLog.patientName}`);
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('VAPI webhook error:', err.message);
        res.status(200).json({ received: true });
    }
};

module.exports = { handleWhatsAppWebhook, handleVapiWebhook };
