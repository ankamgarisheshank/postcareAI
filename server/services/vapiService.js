/**
 * VAPI Voice AI - Outbound call service
 * Triggers phone calls via VAPI → Twilio → Patient
 * Assistant prompt uses {{customer.name}}, {{english}}, {{telugu}}, {{hindi}}
 * All 3 are native script — modern voice models speak Unicode naturally.
 */

const VAPI_API_URL = 'https://api.vapi.ai/call';

const createOutboundCall = async (patientPhone, patientName, messages) => {
    const apiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!apiKey || !assistantId || !phoneNumberId) {
        console.warn('⚠️ VAPI not configured: missing VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID, or VAPI_PHONE_NUMBER_ID');
        return { success: false, error: 'VAPI not configured' };
    }

    // Ensure phone has country code
    let number = patientPhone.trim();
    if (!number.startsWith('+')) {
        number = number.startsWith('0') ? '+91' + number.slice(1) : '+91' + number;
    }

    // Support legacy: messages can be a string or { english, teluguMessage, hindiMessage }
    const english = typeof messages === 'string' ? messages : (messages?.english || messages?.englishMessage || '');
    const telugu = typeof messages === 'string' ? messages : (messages?.teluguMessage || messages?.telugu || '');
    const hindi = typeof messages === 'string' ? messages : (messages?.hindiMessage || messages?.hindi || '');
    const fallback = 'Please take your medication as prescribed.';

    const body = {
        assistantId,
        phoneNumberId,
        customer: {
            number,
            name: patientName || 'Patient',
        },
        assistantOverrides: {
            variableValues: {
                english: english || fallback,
                telugu: telugu || english || fallback,
                hindi: hindi || english || fallback,
            },
        },
    };

    try {
        const response = await fetch(VAPI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ VAPI call failed:', data);
            return { success: false, error: data.message || data.error || 'VAPI call failed', data };
        }

        console.log(`✅ VAPI call initiated: ${data.id} → ${patientName} (${number})`);
        return { success: true, callId: data.id, data };
    } catch (error) {
        console.error('❌ VAPI request error:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { createOutboundCall };
