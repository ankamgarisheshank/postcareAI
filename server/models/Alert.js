const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: [true, 'Doctor reference is required'],
            index: true,
        },
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            required: [true, 'Severity is required'],
            default: 'Low',
        },
        message: {
            type: String,
            required: [true, 'Alert message is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['symptom', 'medication', 'emergency', 'system'],
            default: 'symptom',
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
            ref: 'Doctor',
        },
    },
    {
        timestamps: true,
    }
);

// Index for unresolved alerts
alertSchema.index({ doctor: 1, resolved: 1, severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
