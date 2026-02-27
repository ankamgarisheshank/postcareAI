const twilio = require('twilio');

// Initialize Twilio client
let client;
try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (error) {
    console.warn('⚠️ Twilio client not initialized. Check your credentials.');
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - Message body
 * @returns {Object} Message SID and status
 */
const sendWhatsAppMessage = async (to, message) => {
    try {
        if (!client) {
            console.warn('⚠️ Twilio client not available. Message not sent.');
            return { success: false, message: 'Twilio not configured' };
        }

        // Format phone number for WhatsApp
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: formattedTo,
        });

        console.log(`✅ WhatsApp message sent: ${result.sid}`);
        return {
            success: true,
            sid: result.sid,
            status: result.status,
        };
    } catch (error) {
        console.error('❌ Twilio send error:', error.message);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Send medication reminder via WhatsApp
 * @param {string} phone - Patient phone number
 * @param {string} patientName - Patient name
 * @param {string} medicineName - Medicine name
 * @param {string} dosage - Dosage
 * @param {string} foodInstruction - Food instruction
 * @param {string} timeSlot - Time slot (morning/afternoon/evening)
 */
const sendMedicationReminder = async (phone, patientName, medicineName, dosage, foodInstruction, timeSlot) => {
    const message =
        `🏥 *PostCare AI - Medication Reminder*\n\n` +
        `Hello ${patientName},\n\n` +
        `It's time for your ${timeSlot} medication:\n\n` +
        `💊 *${medicineName}*\n` +
        `📋 Dosage: ${dosage}\n` +
        `🍽️ ${foodInstruction}\n\n` +
        `Please take your medicine and reply with:\n` +
        `✅ "Taken" - if you took it\n` +
        `❌ "Skipped" - if you skipped\n` +
        `🆘 "Help" - if you have any issues\n\n` +
        `_Your health matters! 💙_`;

    return await sendWhatsAppMessage(phone, message);
};

/**
 * Send follow-up question via WhatsApp
 * @param {string} phone - Patient phone number
 * @param {string} patientName - Patient name
 */
const sendFollowUpQuestion = async (phone, patientName) => {
    const message =
        `🏥 *PostCare AI - Daily Check-in*\n\n` +
        `Hello ${patientName},\n\n` +
        `How are you feeling today? Please share:\n\n` +
        `1️⃣ Pain level (0-10)\n` +
        `2️⃣ Any new symptoms?\n` +
        `3️⃣ How's your appetite?\n` +
        `4️⃣ Any concerns?\n\n` +
        `Just type your response naturally, our AI will understand! 🤖\n\n` +
        `_Your recovery is our priority! 💙_`;

    return await sendWhatsAppMessage(phone, message);
};

module.exports = {
    sendWhatsAppMessage,
    sendMedicationReminder,
    sendFollowUpQuestion,
};
