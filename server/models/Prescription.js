const mongoose = require('mongoose');

/**
 * Unified Prescription Schema
 * Compatible with mobile Prescription model.
 * Collection: 'prescriptions'
 */
const prescriptionSchema = new mongoose.Schema(
    {
        // ─── Core fields (shared with mobile) ───
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        drugName: {
            type: String,
            required: [true, 'Drug name is required'],
            trim: true,
        },
        dosage: {
            type: String,
            required: [true, 'Dosage is required'],
            trim: true,
        },
        frequency: {
            type: String,
            required: [true, 'Frequency is required'],
            trim: true,
        },
        // When exactly during the day: "morning","afternoon","evening"
        scheduleTimes: [{ type: String, enum: ['morning', 'afternoon', 'evening'] }],
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        instructions: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ─── Web-extended fields ───
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        remindersSent: [
            {
                sentAt: Date,
                scheduledFor: String,
                status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
            },
        ],
        // Track patient dose acknowledgements
        adherenceLog: [
            {
                date: { type: Date, default: Date.now },
                timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening'] },
                status: { type: String, enum: ['taken', 'skipped', 'missed', 'pending'], default: 'pending' },
                respondedAt: Date,
            },
        ],
    },
    { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, isActive: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
