const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    quantity: { type: String, trim: true, default: '' },
    calories: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: '' },
});

const nutritionScheduleSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required'],
        },
        breakfast: [mealItemSchema],
        morningSnack: [mealItemSchema],
        lunch: [mealItemSchema],
        eveningSnack: [mealItemSchema],
        dinner: [mealItemSchema],
        restrictions: {
            type: [String],
            default: [],
        },
        specialInstructions: {
            type: String,
            trim: true,
            default: '',
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('NutritionSchedule', nutritionScheduleSchema);
