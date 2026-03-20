const express = require('express');
const router = express.Router();
const { getCallLogs } = require('../controllers/callLogController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCallLogs);

module.exports = router;
