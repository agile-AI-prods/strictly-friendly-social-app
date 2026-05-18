const friendService = require('../services/friendService');

exports.addFriend = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }
    const data = await friendService.addFriend(userId, friendId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { friendId } = req.params;
    const data = await friendService.removeFriend(userId, friendId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await friendService.getFriends(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { userId: targetUserId } = req.query;
    const data = await friendService.getFriendsList(userId, targetUserId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkIsFriend = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { friendId } = req.params;
    const data = await friendService.checkIsFriend(userId, friendId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 