const mongoose = require('mongoose');

const callScheduleSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        scheduledAt: { type: Date, required: true },
        message: { type: String, trim: true },
        englishMessage: { type: String, trim: true },
        teluguMessage: { type: String, trim: true },
        hindiMessage: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'pending',
        },
        vapiCallId: { type: String },
        completedAt: { type: Date },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

callScheduleSchema.index({ patientId: 1, scheduledAt: 1 });
callScheduleSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('CallSchedule', callScheduleSchema);
