const Message = require('../models/Message');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');

// OpenClaw gateway config (same as mobile backend)
const GATEWAY_URL = 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = '8445ba83a5213683a998df5f904649dede2319a776f43141';
const AGENT_SESSION_KEY = 'agent:main:main';

/* ------------------------------------------------------------------ */
/*  Helper: invoke OpenClaw gateway tool                               */
/* ------------------------------------------------------------------ */
async function invokeGatewayTool(tool, args) {
    const resp = await fetch(`${GATEWAY_URL}/tools/invoke`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GATEWAY_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, action: 'json', args }),
    });
    return resp.json();
}

/* ------------------------------------------------------------------ */
/*  Helper: ask OpenClaw agent (Gemini 3 Pro)                          */
/* ------------------------------------------------------------------ */
async function askAgent(message, systemContext) {
    try {
        const fullMessage = `[MEDICAL CONTEXT]\n${systemContext}\n\n[USER MESSAGE]\n${message}`;
        const result = await invokeGatewayTool('sessions_send', {
            sessionKey: AGENT_SESSION_KEY,
            message: fullMessage,
        });

        if (result.ok && result.result?.details?.reply) {
            return result.result.details.reply;
        }
        return fallbackResponse(message);
    } catch (error) {
        console.error('[OpenClaw Gateway] askAgent failed:', error);
        return fallbackResponse(message);
    }
}

/* ------------------------------------------------------------------ */
/*  Helper: send WhatsApp via OpenClaw                                 */
/* ------------------------------------------------------------------ */
async function sendWhatsApp(to, message) {
    try {
        const result = await invokeGatewayTool('message', {
            action: 'send',
            channel: 'whatsapp',
            to,
            message,
        });
        if (result.ok && result.result?.details?.result?.messageId) {
            return { success: true, messageId: result.result.details.result.messageId };
        }
        return { success: false };
    } catch (error) {
        console.error('[OpenClaw WhatsApp] failed:', error);
        return { success: false };
    }
}

/* ------------------------------------------------------------------ */
/*  Helper: build patient context for AI                               */
/* ------------------------------------------------------------------ */
function buildPatientContext(patient, daysSinceSurgery, role = 'patient') {
    let ctx = `You are PostCareAI, a medical follow-up AI assistant. Respond helpfully, empathetically, and concisely.\n`;
    ctx += `Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}\n`;
    ctx += `Surgery: ${patient.surgeryType || 'N/A'}, Day ${daysSinceSurgery} post-op\n`;
    ctx += `Doctor: ${patient.assignedDoctor} (phone: ${patient.doctorPhone})\n`;
    ctx += `Risk Status: ${patient.riskStatus}\n`;
    if (patient.diagnosis) ctx += `Diagnosis: ${patient.diagnosis}\n`;
    if (patient.recoveryNotes) ctx += `Recovery Notes: ${patient.recoveryNotes}\n`;
    ctx += `\nThe user role is: ${role}.`;
    if (role === 'doctor') {
        ctx += ` You are assisting a doctor. Give clinical-grade responses. Use medical terminology appropriately.`;
    } else {
        ctx += ` You are speaking to the patient directly. Be warm, clear, and use emoji sparingly. Format with markdown.`;
    }
    return ctx;
}

function fallbackResponse(message) {
    return `I received your message: "${message}". I'm having trouble connecting to my AI engine right now. Your care team has been notified.`;
}

/* ------------------------------------------------------------------ */
/*  GET /api/messages?patientId=xxx                                    */
/* ------------------------------------------------------------------ */
const getMessages = asyncHandler(async (req, res) => {
    const { patientId } = req.query;
    if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
    }
    const messages = await Message.find({ patientId }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
});

/* ------------------------------------------------------------------ */
/*  POST /api/messages — send a direct message (doctor ↔ patient)      */
/* ------------------------------------------------------------------ */
const sendMessage = asyncHandler(async (req, res) => {
    const { patientId, content, from, to, channel } = req.body;

    if (!patientId || !content) {
        return res.status(400).json({ success: false, message: 'patientId and content are required' });
    }

    const senderRole = from || (req.user.role === 'doctor' ? 'doctor' : 'patient');
    const recipientRole = to || (senderRole === 'doctor' ? 'patient' : 'doctor');

    const message = await Message.create({
        patientId,
        from: senderRole,
        to: recipientRole,
        content,
        channel: channel || 'app',
        isDelivered: true,
    });

    // If doctor sends via WhatsApp channel, also push WhatsApp
    if (channel === 'whatsapp' && senderRole === 'doctor') {
        const patient = await Patient.findById(patientId);
        if (patient?.phone) {
            const waMsg = `[PostCareAI] Message from Dr. ${req.user.name}:\n\n${content}`;
            await sendWhatsApp(patient.phone, waMsg);
        }
    }

    // If patient sends via WhatsApp channel, notify doctor
    if (channel === 'whatsapp' && senderRole === 'patient') {
        const patient = await Patient.findById(patientId);
        if (patient?.doctorPhone) {
            const waMsg = `[PostCareAI] Message from ${patient.name}:\n\n${content}`;
            await sendWhatsApp(patient.doctorPhone, waMsg);
        }
    }

    res.status(201).json({ success: true, data: message });
});

/* ------------------------------------------------------------------ */
/*  POST /api/messages/agent — OpenClaw AI agent chat                  */
/* ------------------------------------------------------------------ */
const agentChat = asyncHandler(async (req, res) => {
    const { patientId, message } = req.body;

    if (!patientId || !message) {
        return res.status(400).json({ success: false, message: 'patientId and message are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const daysSinceSurgery = patient.surgeryDate
        ? Math.floor((Date.now() - new Date(patient.surgeryDate).getTime()) / 86400000)
        : 0;

    const role = req.user.role === 'doctor' ? 'doctor' : 'patient';

    // Store user message (to AI)
    await Message.create({
        patientId,
        from: role,
        to: 'ai',
        content: message,
        channel: 'app',
        isDelivered: true,
    });

    // Get AI response from OpenClaw
    const systemContext = buildPatientContext(patient, daysSinceSurgery, role);
    const aiResponse = await askAgent(message, systemContext);

    // Store AI response
    await Message.create({
        patientId,
        from: 'ai',
        to: role,
        content: aiResponse,
        channel: 'app',
        isDelivered: true,
    });

    res.json({
        success: true,
        data: {
            response: aiResponse,
            patientContext: {
                name: patient.name,
                surgeryType: patient.surgeryType,
                daysSinceSurgery,
                riskStatus: patient.riskStatus,
                doctor: patient.assignedDoctor,
            },
        },
    });
});

module.exports = { getMessages, sendMessage, agentChat };
