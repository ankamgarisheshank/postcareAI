const DailyLog = require('../models/DailyLog');
const Alert = require('../models/Alert');
const Patient = require('../models/Patient');
const { classifyMessage } = require('../services/geminiService');
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

module.exports = { handleWhatsAppWebhook };
