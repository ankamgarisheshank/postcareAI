const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
    {
        vapiCallId: { type: String, required: true, index: true },
        scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CallSchedule' },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        patientName: { type: String },
        patientPhone: { type: String },
        scheduledAt: { type: Date },
        startedAt: { type: Date },
        endedAt: { type: Date },
        durationSeconds: { type: Number },
        endedReason: { type: String },
        transcript: { type: String },
        summary: { type: String },
        recordingUrl: { type: String },
        message: { type: String },
        status: { type: String, enum: ['initiated', 'completed', 'failed', 'no-answer'], default: 'initiated' },
    },
    { timestamps: true }
);

callLogSchema.index({ doctor: 1, createdAt: -1 });
callLogSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
