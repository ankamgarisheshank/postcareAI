const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: [true, 'Doctor reference is required'],
            index: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        age: {
            type: Number,
            required: [true, 'Age is required'],
            min: [0, 'Age cannot be negative'],
            max: [150, 'Age cannot exceed 150'],
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            enum: ['Male', 'Female', 'Other'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        admissionDate: {
            type: Date,
            default: Date.now,
        },
        dischargeDate: {
            type: Date,
        },
        surgeryType: {
            type: String,
            trim: true,
            default: '',
        },
        operationDate: {
            type: Date,
        },
        diagnosis: {
            type: String,
            trim: true,
            default: '',
        },
        treatmentSummary: {
            type: String,
            trim: true,
            default: '',
        },
        prescriptionFile: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Active', 'Discharged', 'Critical', 'Recovered'],
            default: 'Active',
        },
        riskLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Low',
        },
        recoveryScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
patientSchema.index({ doctor: 1, status: 1 });
patientSchema.index({ doctor: 1, riskLevel: 1 });

module.exports = mongoose.model('Patient', patientSchema);
