const express = require('express');
const router = express.Router();
const { createSchedule, getSchedules, cancelSchedule, testCall } = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createSchedule);
router.post('/test-call', testCall);
router.get('/', getSchedules);
router.put('/:id/cancel', cancelSchedule);

module.exports = router;
