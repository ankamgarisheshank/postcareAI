const express = require('express');
const { protect } = require('../middleware/auth');
const { getMessages, sendMessage, agentChat } = require('../controllers/messageController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/messages?patientId=xxx  — fetch conversation history
router.get('/', getMessages);

// POST /api/messages              — send a direct message (doctor ↔ patient)
router.post('/', sendMessage);

// POST /api/messages/agent        — OpenClaw AI agent chat
router.post('/agent', agentChat);

module.exports = router;
