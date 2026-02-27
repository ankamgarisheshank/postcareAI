const express = require('express');
const router = express.Router();
const { handleWhatsAppWebhook } = require('../controllers/webhookController');

router.post('/whatsapp', handleWhatsAppWebhook);

module.exports = router;
