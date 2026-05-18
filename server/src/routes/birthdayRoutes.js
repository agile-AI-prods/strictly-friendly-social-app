const express = require('express');
const router = express.Router();
const birthdayController = require('../controllers/birthdayController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/friends/:userId', birthdayController.getFriendsBirthdays);
router.get('/friends/:userId/:year', birthdayController.getFriendsBirthdaysForYear);
router.get('/upcoming/:userId', birthdayController.getUpcomingBirthdays);
router.get('/today/:userId', birthdayController.getTodaysBirthdays);

module.exports = router; 