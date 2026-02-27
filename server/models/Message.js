const mongoose = require('mongoose');

/**
 * Unified Message Schema
 * Stores chat messages between patients, doctors, and AI agent.
 * Compatible with mobile backend Message model.
 */
const messageSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        from: {
            type: String,
            enum: ['patient', 'doctor', 'ai'],
            required: true,
        },
        to: {
            type: String,
            enum: ['patient', 'doctor'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        channel: {
            type: String,
            enum: ['app', 'whatsapp'],
            default: 'app',
        },
        isDelivered: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

messageSchema.index({ patientId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
