const likeService = require('../services/likeService');

exports.getAllLikes = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await likeService.getAllLikes(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLikeById = async (req, res) => {
  try {
    const data = await likeService.getLikeById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLike = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const like = { ...req.body, user_id: userId };
    const data = await likeService.createLike(like);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLike = async (req, res) => {
  try {
    const data = await likeService.updateLike(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLike = async (req, res) => {
  try {
    const data = await likeService.deleteLike(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.likeItem = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { targetId, targetType } = req.params;
    const data = await likeService.likeItem(userId, targetId, targetType);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unlikeItem = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { targetId, targetType } = req.params;
    const data = await likeService.unlikeItem(userId, targetId, targetType);
    res.json({ success: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLikesCount = async (req, res) => {
  try {
    const { targetId, targetType } = req.params;
    const count = await likeService.getLikesCount(targetId, targetType);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.isLiked = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { targetId, targetType } = req.params;
    const isLiked = await likeService.isLiked(userId, targetId, targetType);
    res.json({ isLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 