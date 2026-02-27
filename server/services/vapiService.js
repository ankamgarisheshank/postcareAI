/**
 * VAPI Voice AI - Outbound call service
 * Triggers phone calls via VAPI → Twilio → Patient
 * Assistant uses {{customer.name}} and {{metadata.message}} in prompt
 */

const VAPI_API_URL = 'https://api.vapi.ai/call';

const createOutboundCall = async (patientPhone, patientName, message) => {
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

    const body = {
        assistantId,
        phoneNumberId,
        customer: {
            number,
            name: patientName || 'Patient',
        },
        assistantOverrides: {
            metadata: { message: message || 'Please take your medication as prescribed.' },
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
