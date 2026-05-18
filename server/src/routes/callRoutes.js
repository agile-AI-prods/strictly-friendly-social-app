const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const auth = require('../middleware/auth');

router.use(auth);

// Create a new call
router.post('/', callController.createCall);

// Get call by ID
router.get('/:callId', callController.getCallById);

// Update call status
router.put('/:callId', callController.updateCallStatus);

// End a call
router.delete('/:callId', callController.endCall);

// Get user's calls
router.get('/user/calls', callController.getUserCalls);

// Get recent calls between two users
router.get('/recent/:otherUserId', callController.getRecentCallsBetweenUsers);

// Get call statistics for user
router.get('/stats/user', callController.getCallStats);

module.exports = router;
