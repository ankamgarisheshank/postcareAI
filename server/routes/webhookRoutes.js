const express = require('express');
const router = express.Router();
const { handleWhatsAppWebhook, handleVapiWebhook } = require('../controllers/webhookController');

router.post('/whatsapp', handleWhatsAppWebhook);
router.post('/vapi', handleVapiWebhook);

module.exports = router;
