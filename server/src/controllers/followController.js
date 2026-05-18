const followService = require('../services/followService');

exports.getAllFollows = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await followService.getAllFollows(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowById = async (req, res) => {
  try {
    const data = await followService.getFollowById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFollow = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const follow = { ...req.body, follower_id: userId };
    const data = await followService.createFollow(follow);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFollow = async (req, res) => {
  try {
    const data = await followService.updateFollow(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFollow = async (req, res) => {
  try {
    const data = await followService.deleteFollow(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await followService.followUser(userId, req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await followService.unfollowUser(userId, req.params.userId);
    res.json({ success: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const data = await followService.getFollowing(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const data = await followService.getFollowers(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowingCount = async (req, res) => {
  try {
    const count = await followService.getFollowingCount(req.params.userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowersCount = async (req, res) => {
  try {
    const count = await followService.getFollowersCount(req.params.userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.isFollowing = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const isFollowing = await followService.isFollowing(userId, req.params.userId);
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 