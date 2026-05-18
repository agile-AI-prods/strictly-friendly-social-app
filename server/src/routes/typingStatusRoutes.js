const express = require('express');
const router = express.Router();
const typingStatusController = require('../controllers/typingStatusController');
const auth = require('../middleware/auth');

router.use(auth);

// Get typing status for a conversation
router.get('/conversation/:conversationId', typingStatusController.getTypingStatus);

// Set typing status for a user in a conversation
router.post('/conversation/:conversationId', typingStatusController.setTypingStatus);

// Clear typing status for a user in a conversation
router.delete('/conversation/:conversationId', typingStatusController.clearTypingStatus);

// Get all typing statuses for the current user
router.get('/user', typingStatusController.getUserTypingStatuses);

// Clean up old typing statuses (admin function)
router.post('/cleanup', typingStatusController.cleanupOldTypingStatuses);

module.exports = router;
