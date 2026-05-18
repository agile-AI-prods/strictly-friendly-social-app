const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get filtered users for discovery
router.get('/filtered', userController.getFilteredUsers);

// Get friends counts for multiple users
router.post('/friends-counts', userController.getFriendsCounts);

// Get suggested users
router.get('/suggested', userController.getSuggestedUsers);

// Get popular users
router.get('/popular', userController.getPopularUsers);

module.exports = router; 