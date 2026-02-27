const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const { asyncHandler } = require('../middleware/errorHandler');

// OpenClaw gateway config (same as mobile backend)
const GATEWAY_URL = 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = '8445ba83a5213683a998df5f904649dede2319a776f43141';
const AGENT_SESSION_KEY = 'agent:main:main';

// Gemini direct fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/* ------------------------------------------------------------------ */
/*  Helper: fetch with timeout                                         */
/* ------------------------------------------------------------------ */
function fetchWithTimeout(url, options, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/* ------------------------------------------------------------------ */
/*  Helper: invoke OpenClaw gateway tool                               */
/* ------------------------------------------------------------------ */
async function invokeGatewayTool(tool, args) {
    const resp = await fetchWithTimeout(`${GATEWAY_URL}/tools/invoke`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GATEWAY_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, action: 'json', args }),
    }, 15000);
    return resp.json();
}

/* ------------------------------------------------------------------ */
/*  Helper: ask OpenClaw agent (Gemini 3 Pro)                          */
/* ------------------------------------------------------------------ */
async function askAgent(message, systemContext) {
    // Strategy 1: Try OpenClaw gateway (send + poll history)
    try {
        const fullMessage = `[MEDICAL CONTEXT]\n${systemContext}\n\n[USER MESSAGE]\n${message}`;
        const sendTimestamp = Date.now();

        // Send via OpenClaw session — skip WhatsApp delivery (web gets reply via polling)
        const sendResult = await invokeGatewayTool('sessions_send', {
            sessionKey: AGENT_SESSION_KEY,
            message: fullMessage,
            deliveryContext: { channel: 'none' },
        });

        console.log('[OpenClaw] Send result:', JSON.stringify(sendResult?.result?.details || {}).substring(0, 200));

        if (sendResult.ok) {
            // Poll history for a NEW AI reply (timestamp > sendTimestamp)
            const reply = await pollForReply(sendTimestamp, 10, 2500);
            if (reply) return reply;
        }
        console.log('[OpenClaw] No reply found after polling, trying Gemini direct...');
    } catch (error) {
        console.log('[OpenClaw] Gateway failed:', error.name, error.message);
    }

    // Strategy 2: Direct Gemini API call
    if (GEMINI_API_KEY) {
        try {
            return await askGeminiDirect(message, systemContext);
        } catch (error) {
            console.error('[Gemini Direct] failed:', error.message);
        }
    }

    // Strategy 3: Fallback
    return fallbackResponse(message);
}

/* ------------------------------------------------------------------ */
/*  Helper: poll sessions_history for the latest assistant reply        */
/* ------------------------------------------------------------------ */
async function pollForReply(afterTimestamp, maxAttempts = 10, delayMs = 2500) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 2000 : delayMs));
        try {
            const histResult = await invokeGatewayTool('sessions_history', {
                sessionKey: AGENT_SESSION_KEY,
                limit: 3,
            });

            // Parse messages — history comes in content[0].text as JSON string
            let msgs = histResult.result?.details?.messages;
            if (!msgs && histResult.result?.content?.[0]?.text) {
                try {
                    const parsed = JSON.parse(histResult.result.content[0].text);
                    msgs = parsed.messages;
                } catch (_) {}
            }

            if (msgs && msgs.length > 0) {
                // Find the last assistant message that is NEWER than our send
                for (let j = msgs.length - 1; j >= 0; j--) {
                    const m = msgs[j];
                    if (m.role === 'assistant' && m.timestamp >= afterTimestamp) {
                        // Check for error
                        if (m.stopReason === 'error') {
                            let errText = '';
                            if (typeof m.errorMessage === 'string') {
                                errText = m.errorMessage;
                            } else if (m.errorMessage) {
                                errText = JSON.stringify(m.errorMessage);
                            }
                            console.log('[OpenClaw] AI returned error:', errText.substring(0, 300));
                            if (errText.includes('high demand') || errText.includes('503') || errText.includes('UNAVAILABLE')) {
                                return '⚠️ The AI model (Gemini) is currently experiencing high demand. Please try again in a moment. Your care team is still available via Direct messages.';
                            }
                            return null; // Fall through to next strategy
                        }
                        // Extract text content
                        const textPart = (m.content || []).find(c => c.type === 'text');
                        if (textPart?.text) {
                            console.log(`[OpenClaw] Got reply on poll ${i + 1} (${textPart.text.length} chars)`);
                            return textPart.text;
                        }
                    }
                }
            }
            console.log(`[OpenClaw] Poll ${i + 1}/${maxAttempts}: no new assistant reply yet`);
        } catch (e) {
            console.log(`[OpenClaw] Poll attempt ${i + 1} failed:`, e.name);
        }
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  Helper: direct Gemini API (fallback when OpenClaw is down)         */
/* ------------------------------------------------------------------ */
async function askGeminiDirect(message, systemContext) {
    const resp = await fetchWithTimeout(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemContext}\n\nUser: ${message}` }],
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        },
        20000
    );

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new Error('No text in Gemini response');
}

/* ------------------------------------------------------------------ */
/*  Helper: send WhatsApp via OpenClaw                                 */
/* ------------------------------------------------------------------ */
async function sendWhatsApp(to, message) {
    try {
        const resp = await fetchWithTimeout(`${GATEWAY_URL}/tools/invoke`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${GATEWAY_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tool: 'message',
                action: 'send',
                args: { channel: 'whatsapp', to, message },
            }),
        }, 15000);
        const result = await resp.json();
        if (result.ok) {
            const details = result.result?.details || {};
            return { success: true, messageId: details.result?.messageId || 'sent' };
        }
        console.error('[OpenClaw WhatsApp] error:', result.error?.message);
        return { success: false };
    } catch (error) {
        console.error('[OpenClaw WhatsApp] failed:', error.message);
        return { success: false };
    }
}

/* ------------------------------------------------------------------ */
/*  Helper: build patient context for AI                               */
/* ------------------------------------------------------------------ */
function buildPatientContext(patient, daysSinceSurgery, role = 'patient', medications = []) {
    let ctx = `You are PostCareAI, a medical follow-up AI assistant. Respond helpfully, empathetically, and concisely.\n`;
    ctx += `Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}\n`;
    ctx += `Patient Phone (WhatsApp): ${patient.phone || 'N/A'}\n`;
    ctx += `Surgery: ${patient.surgeryType || 'N/A'}, Day ${daysSinceSurgery} post-op\n`;
    ctx += `Doctor: ${patient.assignedDoctor} (phone: ${patient.doctorPhone})\n`;
    ctx += `Risk Status: ${patient.riskStatus}\n`;
    if (patient.diagnosis) ctx += `Diagnosis: ${patient.diagnosis}\n`;
    if (patient.recoveryNotes) ctx += `Recovery Notes: ${patient.recoveryNotes}\n`;

    // Include current medications so AI knows the prescription details
    if (medications.length > 0) {
        ctx += `\n[CURRENT MEDICATIONS]\n`;
        const timeLabels = { morning: '8:00 AM', afternoon: '1:00 PM', evening: '8:00 PM' };
        medications.forEach((med, i) => {
            const times = (med.scheduleTimes || []).map(t => `${t} (${timeLabels[t] || t})`).join(', ');
            ctx += `${i + 1}. ${med.drugName} — ${med.dosage}, Schedule: ${times || med.frequency || 'N/A'}`;
            if (med.instructions) ctx += `, Instructions: ${med.instructions}`;
            const endDate = med.endDate ? new Date(med.endDate).toLocaleDateString('en-IN') : 'ongoing';
            ctx += `, Until: ${endDate}`;
            ctx += `\n`;
        });
        ctx += `Use this medication info to answer patient questions about what to take, when, and how.\n`;
    } else {
        ctx += `\nNo active prescriptions found for this patient.\n`;
    }

    // Include family members
    if (patient.familyMembers?.length > 0) {
        ctx += `\n[FAMILY / EMERGENCY CONTACTS]\n`;
        patient.familyMembers.forEach(fm => {
            ctx += `- ${fm.name} (${fm.relation || 'family'}) — ${fm.phone || 'no phone'}\n`;
        });
    }

    ctx += `\nThe user role is: ${role}.`;
    if (role === 'doctor') {
        ctx += ` You are assisting a doctor. Give clinical-grade responses. Use medical terminology appropriately.`;
        ctx += `\n\n[WHATSAPP CAPABILITY]`;
        ctx += `\nYou can send WhatsApp messages directly to the patient (${patient.name}, ${patient.phone}).`;
        ctx += `\nWhen the doctor asks you to message/notify/remind/inform the patient, compose a friendly patient-facing message and wrap it in these exact tags:`;
        ctx += `\n[SEND_WHATSAPP]Your message to the patient here[/SEND_WHATSAPP]`;
        ctx += `\nThe system will automatically deliver it via WhatsApp to ${patient.phone}.`;
        ctx += `\nAfter the tags, confirm to the doctor that you sent the message.`;
        ctx += `\nIMPORTANT: The text inside the tags should be written FOR the patient (warm, simple language, emoji OK). Do NOT include the tags in normal conversation — only when actually sending.`;
    } else {
        ctx += ` You are speaking to the patient directly. Be warm, clear, and use emoji sparingly. Format with markdown.`;
        ctx += ` When the patient asks about their medications, provide clear details about drug names, dosage, timing, and instructions from the [CURRENT MEDICATIONS] section.`;
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

    // Fetch active medications for this patient
    const now = new Date();
    const activeMeds = await Prescription.find({
        patientId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    }).select('drugName dosage frequency scheduleTimes instructions startDate endDate').lean();

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
    const systemContext = buildPatientContext(patient, daysSinceSurgery, role, activeMeds);
    let aiResponse = await askAgent(message, systemContext);

    // Parse and send any WhatsApp messages the AI wants to deliver
    const whatsappSent = [];
    const waRegex = /\[SEND_WHATSAPP\](.*?)\[\/SEND_WHATSAPP\]/gs;
    let match;
    while ((match = waRegex.exec(aiResponse)) !== null) {
        const waMessage = match[1].trim();
        if (waMessage && patient.phone) {
            const formatted = `🩺 *PostCareAI — Dr. ${patient.assignedDoctor || 'Your Doctor'}*\n\n${waMessage}\n\n_Reply here to respond to your care team._`;
            sendWhatsApp(patient.phone, formatted)
                .then(r => console.log(`[WhatsApp] Sent to ${patient.name} (${patient.phone}): ${r.success}`))
                .catch(e => console.error('[WhatsApp] Send failed:', e.message));
            whatsappSent.push(waMessage);
        }
    }

    // Clean the tags from the response shown on dashboard
    const cleanResponse = aiResponse.replace(/\[SEND_WHATSAPP\].*?\[\/SEND_WHATSAPP\]/gs, '').trim();
    // If the entire response was just the WhatsApp tag, show a confirmation
    const displayResponse = cleanResponse || `✅ WhatsApp message sent to ${patient.name}.`;

    // Store AI response
    await Message.create({
        patientId,
        from: 'ai',
        to: role,
        content: displayResponse,
        channel: 'app',
        isDelivered: true,
    });

    // Also store WhatsApp messages separately for audit
    for (const waMsg of whatsappSent) {
        await Message.create({
            patientId,
            from: 'ai',
            to: 'patient',
            content: waMsg,
            channel: 'whatsapp',
            isDelivered: true,
        });
    }

    res.json({
        success: true,
        data: {
            response: displayResponse,
            whatsappSent: whatsappSent.length > 0 ? whatsappSent.length : 0,
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
