const express = require('express');
const router = express.Router();
const { setNutritionSchedule, getNutritionSchedule } = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/:patientId').get(getNutritionSchedule).post(setNutritionSchedule);

module.exports = router;
