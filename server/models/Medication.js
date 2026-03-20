const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
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
        },
        medicineName: {
            type: String,
            required: [true, 'Medicine name is required'],
            trim: true,
        },
        dosage: {
            type: String,
            required: [true, 'Dosage is required'],
            trim: true,
        },
        frequency: {
            morning: { type: Boolean, default: false },
            afternoon: { type: Boolean, default: false },
            evening: { type: Boolean, default: false },
        },
        foodInstruction: {
            type: String,
            enum: ['Before Food', 'After Food', 'With Food', 'Any Time'],
            default: 'After Food',
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        duration: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        remindersSent: [
            {
                sentAt: { type: Date, default: Date.now },
                timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening'] },
                status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Auto-deactivate expired medications
medicationSchema.pre('find', function () {
    this.where({ $or: [{ endDate: { $gte: new Date() } }, { isActive: true }] });
});

module.exports = mongoose.model('Medication', medicationSchema);
