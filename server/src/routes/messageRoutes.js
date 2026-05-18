const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.get('/conversation/:userId', messageController.getMessagesByUser); // ?page=1&limit=50
router.patch('/mark-as-read/:userId', messageController.markAsRead);
router.get('/connected-users', messageController.fetchConnectedUsers);
router.get('/unread-counts', messageController.fetchUnreadMessageCounts);
router.get('/', messageController.getAllMessages);
router.get('/:id', messageController.getMessageById);
router.post('/', messageController.createMessage);
router.post('/upload-image', upload.single('image'), messageController.uploadImage);
router.put('/:id', messageController.updateMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router; 