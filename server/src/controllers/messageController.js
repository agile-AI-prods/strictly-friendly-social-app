const messageService = require('../services/messageService');

exports.getAllMessages = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await messageService.getAllMessages(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const data = await messageService.getMessageById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    console.log('=== createMessage called ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      console.log('No user ID found in token');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('User ID:', userId);
    
    const message = { ...req.body, sender_id: userId };
    console.log('Message to create:', message);
    
    const data = await messageService.createMessage(message);
    console.log('Message created successfully:', data);
    
    res.json(data);
  } catch (err) {
    console.error('Error in createMessage:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await messageService.updateMessage(req.params.id, req.body, userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await messageService.deleteMessage(req.params.id, userId);
    res.json(data);
  } catch (err) {
    console.log('Error deleting message:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessagesByUser = async (req, res) => {
  try {
    const user_id = req.user.id || req.user.sub;
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const data = await messageService.getMessagesByUser(user_id, userId, Number(page), Number(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const user_id = req.user.id || req.user.sub;
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { userId } = req.params;
    const data = await messageService.markAsRead(user_id, userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchConnectedUsers = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await messageService.fetchConnectedUsers(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchUnreadMessageCounts = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = await messageService.fetchUnreadMessageCounts(userId);
    res.json(data);
  } catch (err) {
    console.log('Error fetching unread message counts:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const senderId = req.user.id || req.user.sub;
    const imageUrl = await messageService.uploadImage(req.file, senderId);
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
}; 