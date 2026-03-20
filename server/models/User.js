const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 4,
            select: false,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
        },
        role: {
            type: String,
            enum: ['doctor', 'patient', 'admin'],
            required: true,
            default: 'doctor',
        },
        // Patient-specific
        linkedPatientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
        },
        // Doctor-specific
        specialization: String,
        hospital: String,
        avatar: String,
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
