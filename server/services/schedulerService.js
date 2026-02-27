const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Alert = require('../models/Alert');
const Message = require('../models/Message');

/* ------------------------------------------------------------------ */
/*  OpenClaw WhatsApp helper (same as messageController)               */
/* ------------------------------------------------------------------ */
const GATEWAY_URL = 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = '8445ba83a5213683a998df5f904649dede2319a776f43141';

function fetchWithTimeout(url, options, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

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
            console.log(`  ✅ WhatsApp sent to ${to}`);
            return { success: true };
        }
        console.error(`  ❌ WhatsApp to ${to}: ${result.error?.message || 'unknown'}`);
        return { success: false };
    } catch (error) {
        console.error(`  ❌ WhatsApp to ${to}: ${error.message}`);
        return { success: false };
    }
}

/* ------------------------------------------------------------------ */
/*  Risk scoring for missed-dose severity                              */
/* ------------------------------------------------------------------ */
const HIGH_RISK_KEYWORDS = ['cardiac', 'heart', 'cancer', 'transplant', 'diabetes', 'insulin', 'dialysis', 'stroke', 'epilepsy', 'seizure', 'blood thinner', 'anticoagulant', 'chemo'];

function isHighRiskPatient(patient) {
    const combined = `${patient.diagnosis || ''} ${patient.surgeryType || ''} ${patient.recoveryNotes || ''}`.toLowerCase();
    return patient.riskStatus === 'critical' || patient.riskLevel === 'High' || patient.status === 'Critical' || HIGH_RISK_KEYWORDS.some(k => combined.includes(k));
}

/* ------------------------------------------------------------------ */
/*  Initialize all cron jobs                                           */
/* ------------------------------------------------------------------ */
const initScheduler = () => {
    console.log('⏰ Initializing medication scheduler...');

    // Morning medication reminder - 8:00 AM
    cron.schedule('0 8 * * *', () => {
        console.log('🌅 Running morning medication reminders...');
        sendReminders('morning');
    });

    // Afternoon medication reminder - 1:00 PM
    cron.schedule('0 13 * * *', () => {
        console.log('☀️ Running afternoon medication reminders...');
        sendReminders('afternoon');
    });

    // Evening medication reminder - 8:00 PM
    cron.schedule('0 20 * * *', () => {
        console.log('🌙 Running evening medication reminders...');
        sendReminders('evening');
    });

    // Follow-up / reminder re-send - 1hr after each slot (9 AM, 2 PM, 9 PM)
    cron.schedule('0 9 * * *', () => checkMissedDoses('morning'));
    cron.schedule('0 14 * * *', () => checkMissedDoses('afternoon'));
    cron.schedule('0 21 * * *', () => checkMissedDoses('evening'));

    // Escalation check — every 4 hours, look for patients who missed multiple doses
    cron.schedule('0 */4 * * *', () => escalateMissedDoses());

    // Daily follow-up check-in - 10:00 AM
    cron.schedule('0 10 * * *', () => sendDailyFollowUps());

    console.log('✅ Medication scheduler initialized successfully');
};

/* ------------------------------------------------------------------ */
/*  Send medication reminders for a time slot                          */
/* ------------------------------------------------------------------ */
const sendReminders = async (timeSlot) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Find active prescriptions that have this time slot
        const medications = await Prescription.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            scheduleTimes: timeSlot,
        }).populate('patientId', 'name phone status riskStatus');

        console.log(`  Found ${medications.length} medications for ${timeSlot} reminders`);

        for (const med of medications) {
            const patient = med.patientId;
            if (!patient || patient.status === 'Recovered' || !patient.phone) continue;

            try {
                const message =
                    `🏥 *PostCare AI — Medication Reminder*\n\n` +
                    `Hello ${patient.name} 👋\n\n` +
                    `It's time for your *${timeSlot}* medication:\n\n` +
                    `💊 *${med.drugName}* — ${med.dosage}\n` +
                    `${med.instructions ? `📋 ${med.instructions}\n` : ''}` +
                    `\nPlease take your medicine and reply:\n` +
                    `✅ *Taken* — if taken\n` +
                    `❌ *Skipped* — if skipped\n` +
                    `🆘 *Help* — if you need assistance\n\n` +
                    `_Your health matters! 💙_`;

                const result = await sendWhatsApp(patient.phone, message);

                // Log reminder sent
                if (!med.remindersSent) med.remindersSent = [];
                med.remindersSent.push({ sentAt: new Date(), scheduledFor: timeSlot, status: result.success ? 'sent' : 'failed' });

                // Add a pending adherence entry for today
                if (!med.adherenceLog) med.adherenceLog = [];
                const alreadyLogged = med.adherenceLog.some(a => a.timeSlot === timeSlot && new Date(a.date) >= today);
                if (!alreadyLogged) {
                    med.adherenceLog.push({ date: new Date(), timeSlot, status: 'pending' });
                }
                await med.save();

                // Store as system message for audit
                await Message.create({
                    patientId: patient._id,
                    from: 'ai',
                    to: 'patient',
                    content: `💊 Medication reminder sent: ${med.drugName} (${timeSlot})`,
                    channel: 'whatsapp',
                    isDelivered: result.success,
                });

            } catch (err) {
                console.error(`  Failed to send reminder for ${patient.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Reminder scheduler error:', error.message);
    }
};

/* ------------------------------------------------------------------ */
/*  Check for missed doses 1 hour after reminder — send follow-up      */
/* ------------------------------------------------------------------ */
const checkMissedDoses = async (timeSlot) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Find prescriptions with 'pending' adherence for this time slot today
        const medications = await Prescription.find({
            isActive: true,
            scheduleTimes: timeSlot,
            'adherenceLog': {
                $elemMatch: { timeSlot, status: 'pending', date: { $gte: today } },
            },
        }).populate('patientId', 'name phone status riskStatus');

        console.log(`⏰ Follow-up: ${medications.length} pending ${timeSlot} doses`);

        for (const med of medications) {
            const patient = med.patientId;
            if (!patient || !patient.phone) continue;

            // Mark as missed (no response after 1 hour)
            const logEntry = med.adherenceLog.find(a => a.timeSlot === timeSlot && a.status === 'pending' && new Date(a.date) >= today);
            if (logEntry) {
                logEntry.status = 'missed';
                await med.save();
            }

            // Send a softer follow-up
            const followUp =
                `⚠️ *PostCare AI — Gentle Reminder*\n\n` +
                `Hi ${patient.name}, we noticed you haven't confirmed taking your *${med.drugName}* (${med.dosage}) for the ${timeSlot} dose.\n\n` +
                `If you've already taken it, just reply *"Taken"*.\n` +
                `If you're having trouble, reply *"Help"* and we'll assist you.\n\n` +
                `_Your recovery depends on regular medication! 💪_`;

            await sendWhatsApp(patient.phone, followUp);
        }
    } catch (error) {
        console.error('Missed dose check error:', error.message);
    }
};

/* ------------------------------------------------------------------ */
/*  Escalation: if patient missed 2+ doses today, alert doctor/family  */
/* ------------------------------------------------------------------ */
const escalateMissedDoses = async () => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Find all active prescriptions with missed doses today
        const medications = await Prescription.find({
            isActive: true,
            'adherenceLog': {
                $elemMatch: { status: 'missed', date: { $gte: today } },
            },
        }).populate('patientId');

        // Group by patient
        const patientMissed = {};
        for (const med of medications) {
            const pid = med.patientId?._id?.toString();
            if (!pid) continue;
            if (!patientMissed[pid]) patientMissed[pid] = { patient: med.patientId, meds: [] };
            const missed = med.adherenceLog.filter(a => a.status === 'missed' && new Date(a.date) >= today);
            if (missed.length > 0) patientMissed[pid].meds.push({ drugName: med.drugName, dosage: med.dosage, missedCount: missed.length });
        }

        for (const pid of Object.keys(patientMissed)) {
            const { patient, meds } = patientMissed[pid];
            const totalMissed = meds.reduce((s, m) => s + m.missedCount, 0);

            // Only escalate if 2+ missed OR if high-risk patient with even 1 miss
            const highRisk = isHighRiskPatient(patient);
            if (totalMissed < 2 && !highRisk) continue;

            // Check if we already escalated today (avoid spam)
            const existingAlert = await Alert.findOne({
                patientId: patient._id,
                type: 'missed_medication',
                createdAt: { $gte: today },
            });
            if (existingAlert) continue;

            console.log(`🚨 Escalating missed medications for ${patient.name}: ${totalMissed} doses missed`);

            const medList = meds.map(m => `• ${m.drugName} (${m.dosage}) — ${m.missedCount} missed`).join('\n');
            const severity = highRisk ? 'High' : totalMissed >= 3 ? 'High' : 'Medium';

            // Create alert
            await Alert.create({
                patientId: patient._id,
                doctor: patient.doctor,
                severity: severity.toLowerCase(),
                title: 'Missed Medication Alert',
                message: `${patient.name} missed ${totalMissed} medication dose(s) today:\n${medList}`,
                type: 'missed_medication',
            });

            // Notify doctor via WhatsApp
            if (patient.doctorPhone) {
                const doctorMsg =
                    `🚨 *PostCare AI — Missed Medication Alert*\n\n` +
                    `Patient *${patient.name}* (${patient.phone}) has missed *${totalMissed}* medication dose(s) today:\n\n` +
                    `${medList}\n\n` +
                    `${highRisk ? '⚠️ This is a HIGH-RISK patient.\n\n' : ''}` +
                    `Please follow up with the patient.`;
                await sendWhatsApp(patient.doctorPhone, doctorMsg);
            }

            // Notify family members via WhatsApp
            if (patient.familyMembers?.length > 0) {
                for (const fm of patient.familyMembers) {
                    if (!fm.phone) continue;
                    const familyMsg =
                        `🏥 *PostCare AI — Important Notice*\n\n` +
                        `Hello ${fm.name},\n\n` +
                        `Your ${fm.relation ? fm.relation.toLowerCase() : 'family member'}, *${patient.name}*, has missed *${totalMissed}* medication dose(s) today:\n\n` +
                        `${medList}\n\n` +
                        `${highRisk ? '⚠️ This requires immediate attention due to the patient\'s condition.\n\n' : ''}` +
                        `Please help ensure they take their medications on time. Your support makes a big difference in their recovery! 💙`;
                    await sendWhatsApp(fm.phone, familyMsg);
                    console.log(`  📱 Family notified: ${fm.name} (${fm.relation}) at ${fm.phone}`);
                }
            }

            // Store audit message
            await Message.create({
                patientId: patient._id,
                from: 'ai',
                to: 'doctor',
                content: `🚨 Escalation: ${patient.name} missed ${totalMissed} dose(s). Doctor and ${patient.familyMembers?.length || 0} family members notified.`,
                channel: 'app',
                isDelivered: true,
            });
        }
    } catch (error) {
        console.error('Escalation check error:', error.message);
    }
};

/* ------------------------------------------------------------------ */
/*  Daily follow-up check-ins                                          */
/* ------------------------------------------------------------------ */
const sendDailyFollowUps = async () => {
    try {
        const activePatients = await Patient.find({
            status: { $in: ['Active', 'Critical'] },
            phone: { $exists: true, $ne: '' },
        });

        console.log(`📋 Sending follow-ups to ${activePatients.length} active patients`);

        for (const patient of activePatients) {
            try {
                const message =
                    `🏥 *PostCare AI — Daily Check-in*\n\n` +
                    `Hello ${patient.name} 👋\n\n` +
                    `How are you feeling today? Please share:\n\n` +
                    `1️⃣ Pain level (0-10)\n` +
                    `2️⃣ Any new symptoms?\n` +
                    `3️⃣ How's your appetite?\n` +
                    `4️⃣ Any concerns?\n\n` +
                    `Just type your response naturally — our AI will understand! 🤖\n\n` +
                    `_Your recovery is our priority! 💙_`;

                await sendWhatsApp(patient.phone, message);
            } catch (err) {
                console.error(`  Failed to send follow-up to ${patient.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Follow-up scheduler error:', error.message);
    }
};

module.exports = { initScheduler };
