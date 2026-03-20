const mongoose = require('mongoose');

/**
 * Unified Alert Schema
 * Compatible with BOTH mobile and web alert models.
 * Mobile uses: patientId, type, title, message, severity, isRead
 * Web adds: doctor, resolved, resolvedAt, resolvedBy
 */
const alertSchema = new mongoose.Schema(
    {
        // ─── Core fields (shared with mobile) ───
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['red_flag', 'medication_missed', 'missed_medication', 'patient_message', 'call_request', 'symptom', 'medication', 'emergency', 'system'],
            required: true,
            default: 'symptom',
        },
        title: {
            type: String,
            default: '',
        },
        message: {
            type: String,
            required: [true, 'Alert message is required'],
            trim: true,
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true,
            default: 'medium',
        },
        isRead: {
            type: Boolean,
            default: false,
        },

        // ─── Web-extended fields ───
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

alertSchema.index({ doctor: 1, resolved: 1, severity: 1 });
alertSchema.index({ patientId: 1, isRead: 1 });

module.exports = mongoose.model('Alert', alertSchema);
