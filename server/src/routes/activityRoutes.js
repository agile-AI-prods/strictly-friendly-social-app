const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/', activityController.getAllActivities);
router.get('/:id', activityController.getActivityById);
router.post('/', authenticateToken, activityController.createActivity);
router.put('/:id', authenticateToken, activityController.updateActivity);
router.delete('/:id', authenticateToken, activityController.deleteActivity);
router.post('/invite', authenticateToken, activityController.inviteParticipants);
router.post('/participant-status', authenticateToken, activityController.updateParticipantStatus);
router.get('/suggested/:userId', activityController.getSuggestedActivities);
router.get('/filtered', activityController.getActivities); // Accepts filters as query params
router.post('/upload-image', authenticateToken, upload.single('image'), activityController.uploadImage);

module.exports = router; 