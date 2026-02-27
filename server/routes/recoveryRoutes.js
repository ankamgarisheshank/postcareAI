const express = require('express');
const router = express.Router();
const { addRecoveryLog, getRecoveryLogs } = require('../controllers/recoveryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/:patientId').get(getRecoveryLogs).post(addRecoveryLog);

module.exports = router;
