const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
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

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size exceeds the 5MB limit. Please choose a smaller image.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.get('/me', auth, profileController.getMe); // Specific route first
router.get('/current-user/profile', auth, profileController.getProfileByCurrentUserEmail);
router.put('/current-user/profile', auth, profileController.updateProfileByCurrentUserEmail);
router.get('/:id', profileController.getProfile);
router.put('/:id', profileController.updateProfile);
router.post('/:id/photo', auth, upload.single('photo'), handleMulterError, profileController.uploadPhoto);
router.post('/:id/cover', auth, upload.single('cover'), handleMulterError, profileController.uploadCoverImage);
router.post('/', auth, profileController.createProfile);
router.get('/', profileController.getAllProfiles);
router.get('/filtered', auth, profileController.getFilteredProfiles);

module.exports = router; 