const mongoose = require('mongoose');

/**
 * Patient Schema definition.
 * 
 * This model represents a patient in the PostCare AI system. It includes core demographic 
 * data, surgical history, and real-time health monitoring status (riskStatus, recoveryScore).
 * 
 * The schema is designed to be trilingual-friendly and supports both mobile and 
 * web dashboard interactions.
 * 
 * @typedef {Object} Patient
 * @property {string} name - Full name of the patient
 * @property {number} age - Patient's current age
 * @property {string} gender - Male, Female, or Other
 * @property {string} phone - Mobile number for SMS/WhatsApp notifications
 * @property {string} surgeryType - The type of surgery performed
 * @property {string} riskStatus - Health status: stable, monitor, or critical
 */
const patientSchema = new mongoose.Schema(
    {
        // ─── Core fields (shared with mobile) ───
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        age: {
            type: Number,
            required: [true, 'Age is required'],
            min: 0,
            max: 150,
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
        surgeryType: {
            type: String,
            trim: true,
            default: '',
        },
        surgeryDate: {
            type: Date,
        },
        admissionDate: {
            type: Date,
            default: Date.now,
        },
        dischargeDate: {
            type: Date,
        },
        assignedDoctor: {
            type: String,
            default: '',
        },
        doctorPhone: {
            type: String,
            default: '',
        },
        riskStatus: {
            type: String,
            enum: ['stable', 'monitor', 'critical'],
            default: 'stable',
        },
        recoveryNotes: {
            type: String,
            default: '',
        },

        // ─── Web-extended fields (optional) ───
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        location: {
            lat: { type: Number },
            lng: { type: Number },
            formattedAddress: { type: String },
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

        // ─── Family / Emergency Contacts ───
        familyMembers: [
            {
                name: { type: String, trim: true },
                relation: { type: String, trim: true }, // e.g. "Father", "Wife", "Son"
                phone: { type: String, trim: true },    // WhatsApp-capable
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
patientSchema.index({ doctor: 1, status: 1 });
patientSchema.index({ doctor: 1, riskLevel: 1 });
patientSchema.index({ assignedDoctor: 1 });

module.exports = mongoose.model('Patient', patientSchema);
