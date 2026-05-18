const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const auth = require('../middleware/auth');

router.use(auth);

// Fetch different types of connections
router.get('/connected', connectionController.getConnectedConnections);
router.get('/pending', connectionController.getPendingConnections);
router.get('/sent', connectionController.getSentConnections);
router.get('/rejected', connectionController.getRejectedConnections);
router.get('/statuses', connectionController.getConnectionStatuses);
router.get('/user/:userId/connected', connectionController.getUserConnectedConnections);
router.get('/:userId/friends/count', connectionController.getFriendsCount);

// Connection actions
router.post('/send', connectionController.sendConnectionRequest);
router.put('/accept/:id', connectionController.acceptConnectionRequest);
router.put('/reject/:id', connectionController.rejectConnectionRequest);
router.delete('/:id', connectionController.removeConnection);

module.exports = router; 