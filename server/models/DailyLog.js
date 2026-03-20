const mongoose = require('mongoose');

/**
 * Unified DailyLog Schema
 * Compatible with mobile DailyLog model.
 * Collection: 'dailylogs'
 */
const dailyLogSchema = new mongoose.Schema(
    {
        // ─── Core fields (shared with mobile) ───
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        painLevel: {
            type: Number,
            required: true,
            min: 0,
            max: 10,
        },
        temperature: {
            type: Number,
        },
        symptoms: [{ type: String }],
        mood: {
            type: String,
            enum: ['good', 'okay', 'bad'],
            default: 'okay',
        },
        notes: {
            type: String,
            default: '',
        },
        loggedBy: {
            type: String,
            enum: ['doctor', 'ai', 'patient', 'system'],
            default: 'doctor',
        },

        // ─── Web-extended fields ───
        medicineAdherence: {
            type: Boolean,
        },
        message: {
            type: String,
        },
        source: {
            type: String,
            enum: ['whatsapp', 'manual', 'system', 'app'],
            default: 'manual',
        },
        vitalSigns: {
            temperature: Number,
            bloodPressure: String,
            heartRate: Number,
            oxygenLevel: Number,
        },
    },
    { timestamps: true }
);

dailyLogSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
