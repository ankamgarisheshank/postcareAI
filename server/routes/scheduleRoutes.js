const express = require('express');
const router = express.Router();
const { createSchedule, getSchedules, cancelSchedule, testCall, translatePreview, processNow, parseTime } = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/parse-time', parseTime);
router.get('/translate-preview', translatePreview);
router.post('/process-now', processNow);
router.post('/', createSchedule);
router.post('/test-call', testCall);
router.get('/', getSchedules);
router.put('/:id/cancel', cancelSchedule);

module.exports = router;
