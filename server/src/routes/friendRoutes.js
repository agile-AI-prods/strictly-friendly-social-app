const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Friend routes
router.post('/add', friendController.addFriend);
router.delete('/:friendId', friendController.removeFriend);
router.get('/', friendController.getFriends);
router.get('/list', friendController.getFriendsList);
router.get('/check/:friendId', friendController.checkIsFriend);

module.exports = router; 