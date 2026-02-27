const RecoveryLog = require('../models/RecoveryLog');
const Alert = require('../models/Alert');
const Patient = require('../models/Patient');
const { classifyMessage } = require('../services/geminiService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    WhatsApp webhook handler - receive patient messages
 * @route   POST /api/webhook/whatsapp
 * @access  Public (validated by Twilio signature)
 */
const handleWhatsAppWebhook = asyncHandler(async (req, res) => {
    const { Body: messageBody, From: fromNumber, To: toNumber } = req.body;

    if (!messageBody || !fromNumber) {
        return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    // Extract phone number (remove 'whatsapp:' prefix)
    const phone = fromNumber.replace('whatsapp:', '');

    // Find patient by phone number
    const patient = await Patient.findOne({ phone: { $regex: phone.replace('+', '') } });

    if (!patient) {
        console.log(`⚠️ Unknown patient message from: ${phone}`);
        // Still respond with 200 to acknowledge receipt
        return res.status(200).json({ success: true, message: 'Acknowledged' });
    }

    // Classify message using Gemini AI
    const classification = await classifyMessage(messageBody);

    // Parse pain level from message
    let painLevel = 0;
    const painMatch = messageBody.match(/(\d+)/);
    if (painMatch) {
        const num = parseInt(painMatch[1]);
        if (num >= 0 && num <= 10) painLevel = num;
    }

    // Determine medicine adherence from message
    const lowerMsg = messageBody.toLowerCase();
    const medicineAdherence =
        lowerMsg.includes('taken') || lowerMsg.includes('yes') || lowerMsg.includes('done');

    // Create recovery log
    const recoveryLog = await RecoveryLog.create({
        patient: patient._id,
        painLevel,
        message: messageBody,
        source: 'whatsapp',
        medicineAdherence,
        symptoms: classification.summary ? [classification.summary] : [],
        mood:
            classification.severity === 'High'
                ? 'Critical'
                : classification.severity === 'Medium'
                    ? 'Poor'
                    : 'Good',
    });

    // If severity is HIGH or MEDIUM, create an alert
    if (classification.severity === 'High' || classification.severity === 'Medium') {
        await Alert.create({
            patient: patient._id,
            doctor: patient.doctor,
            severity: classification.severity,
            message: `Patient replied: "${messageBody}" — AI Assessment: ${classification.summary}`,
            type: 'symptom',
        });

        // Update patient risk level if HIGH
        if (classification.severity === 'High') {
            patient.riskLevel = 'High';
            patient.status = 'Critical';
            await patient.save();
        }
    }

    // Respond with TwiML (empty response to acknowledge)
    res.set('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');
});

module.exports = { handleWhatsAppWebhook };
