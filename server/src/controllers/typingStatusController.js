const typingStatusService = require('../services/typingStatusService');

// Get typing status for a conversation
exports.getTypingStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    const typingStatus = await typingStatusService.getTypingStatus(conversationId);
    res.json(typingStatus);
  } catch (error) {
    console.error('Error fetching typing status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Set typing status for a user in a conversation
exports.setTypingStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    const { isTyping } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    if (typeof isTyping !== 'boolean') {
      return res.status(400).json({ error: 'isTyping must be a boolean' });
    }

    const result = await typingStatusService.setTypingStatus(userId, conversationId, isTyping);
    res.json(result);
  } catch (error) {
    console.error('Error setting typing status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Clear typing status for a user in a conversation
exports.clearTypingStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    const result = await typingStatusService.clearTypingStatus(userId, conversationId);
    res.json(result);
  } catch (error) {
    console.error('Error clearing typing status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all typing statuses for a user
exports.getUserTypingStatuses = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const statuses = await typingStatusService.getUserTypingStatuses(userId);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching user typing statuses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Clean up old typing statuses (admin function)
exports.cleanupOldTypingStatuses = async (req, res) => {
  try {
    const result = await typingStatusService.cleanupOldTypingStatuses();
    res.json(result);
  } catch (error) {
    console.error('Error cleaning up old typing statuses:', error);
    res.status(500).json({ error: error.message });
  }
};
