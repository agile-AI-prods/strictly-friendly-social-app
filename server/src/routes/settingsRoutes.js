const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// POST /api/settings - Save or create user settings
router.post('/', settingsController.saveUserSettings);

// GET /api/settings/:email - Get user settings by email
router.get('/:email', settingsController.getUserSettings);

// PUT /api/settings/:email - Update existing user settings
router.put('/:email', settingsController.updateUserSettings);

// POST /api/settings/general - Save or create general settings
router.post('/general', settingsController.saveGeneralSettings);

// PUT /api/settings/general/:email - Update existing general settings
router.put('/general/:email', settingsController.updateGeneralSettings);

// GET /api/settings/follow-me/:email - Check follow_me status for a user
router.get('/follow-me/:email', settingsController.checkFollowMeStatus);

// GET /api/settings/birthday-privacy/:email - Check birthday privacy setting for a user
router.get('/birthday-privacy/:email', settingsController.checkBirthdayPrivacy);

// GET /api/settings/bio-privacy/:email - Check bio privacy setting for a user
router.get('/bio-privacy/:email', settingsController.checkBioPrivacy);

// GET /api/settings/email-privacy/:email - Check email privacy setting for a user
router.get('/email-privacy/:email', settingsController.checkEmailPrivacy);

module.exports = router; 