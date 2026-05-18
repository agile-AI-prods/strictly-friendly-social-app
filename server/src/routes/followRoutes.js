const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', followController.getAllFollows);
router.get('/:id', followController.getFollowById);
router.post('/', followController.createFollow);
router.put('/:id', followController.updateFollow);
router.delete('/:id', followController.deleteFollow);
router.post('/:userId', followController.followUser);
router.delete('/:userId', followController.unfollowUser);
router.get('/:userId/following', followController.getFollowing);
router.get('/:userId/followers', followController.getFollowers);
router.get('/:userId/following/count', followController.getFollowingCount);
router.get('/:userId/followers/count', followController.getFollowersCount);
router.get('/:userId/is-following', followController.isFollowing);

module.exports = router; 