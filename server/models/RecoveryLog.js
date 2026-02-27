const mongoose = require('mongoose');

const recoveryLogSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        painLevel: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
        },
        symptoms: {
            type: [String],
            default: [],
        },
        medicineAdherence: {
            type: Boolean,
            default: true,
        },
        message: {
            type: String,
            trim: true,
            default: '',
        },
        source: {
            type: String,
            enum: ['whatsapp', 'manual', 'system'],
            default: 'manual',
        },
        mood: {
            type: String,
            enum: ['Good', 'Fair', 'Poor', 'Critical'],
            default: 'Good',
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
        vitalSigns: {
            temperature: { type: Number },
            bloodPressure: { type: String },
            heartRate: { type: Number },
            oxygenLevel: { type: Number },
        },
    },
    {
        timestamps: true,
    }
);

// Index for time-series queries
recoveryLogSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('RecoveryLog', recoveryLogSchema);
