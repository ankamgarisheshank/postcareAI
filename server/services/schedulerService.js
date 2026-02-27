const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { sendMedicationReminder, sendFollowUpQuestion } = require('./twilioService');
const { MED_TIMES } = require('../config/constants');

/**
 * Initialize all cron jobs for medication reminders
 */
const initScheduler = () => {
    console.log('⏰ Initializing medication scheduler...');

    // Morning medication reminder - 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('🌅 Running morning medication reminders...');
        await sendReminders('morning');
    });

    // Afternoon medication reminder - 1:00 PM
    cron.schedule('0 13 * * *', async () => {
        console.log('☀️ Running afternoon medication reminders...');
        await sendReminders('afternoon');
    });

    // Evening medication reminder - 8:00 PM
    cron.schedule('0 20 * * *', async () => {
        console.log('🌙 Running evening medication reminders...');
        await sendReminders('evening');
    });

    // Daily follow-up check-in - 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('📋 Running daily follow-up check-ins...');
        await sendDailyFollowUps();
    });

    console.log('✅ Medication scheduler initialized successfully');
};

/**
 * Send medication reminders for a specific time slot
 * @param {string} timeSlot - morning, afternoon, or evening
 */
const sendReminders = async (timeSlot) => {
    try {
        const now = new Date();

        // Find active medications for this time slot
        const medications = await Prescription.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).populate('patientId', 'name phone status');

        console.log(`Found ${medications.length} medications for ${timeSlot} reminders`);

        for (const med of medications) {
            const patient = med.patientId;
            if (!patient || patient.status === 'Recovered') continue;

            try {
                const result = await sendMedicationReminder(
                    patient.phone,
                    patient.name,
                    med.drugName,
                    med.dosage,
                    med.instructions,
                    timeSlot
                );

                // Log the reminder
                if (!med.remindersSent) med.remindersSent = [];
                med.remindersSent.push({
                    sentAt: new Date(),
                    scheduledFor: timeSlot,
                    status: result.success ? 'sent' : 'failed',
                });
                await med.save();
            } catch (err) {
                console.error(`Failed to send reminder for ${patient.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Reminder scheduler error:', error.message);
    }
};

/**
 * Send daily follow-up check-ins to active patients
 */
const sendDailyFollowUps = async () => {
    try {
        const activePatients = await Patient.find({
            status: { $in: ['Active', 'Critical'] },
        });

        console.log(`Sending follow-ups to ${activePatients.length} active patients`);

        for (const patient of activePatients) {
            try {
                await sendFollowUpQuestion(patient.phone, patient.name);
            } catch (err) {
                console.error(`Failed to send follow-up to ${patient.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Follow-up scheduler error:', error.message);
    }
};

module.exports = { initScheduler };
