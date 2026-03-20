const express = require('express');
const router = express.Router();
const { getAlerts, resolveAlert, getAlertStats } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
