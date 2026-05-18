const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', likeController.getAllLikes);
router.get('/:id', likeController.getLikeById);
router.post('/', likeController.createLike);
router.put('/:id', likeController.updateLike);
router.delete('/:id', likeController.deleteLike);
router.post('/:targetId/:targetType', likeController.likeItem);
router.delete('/:targetId/:targetType', likeController.unlikeItem);
router.get('/:targetId/:targetType/count', likeController.getLikesCount);
router.get('/:targetId/:targetType/is-liked', likeController.isLiked);

module.exports = router; 