const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notifications = await notificationService.getNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await notificationService.markAsRead(id, userId);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await notificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await notificationService.deleteNotification(id, userId);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const notificationData = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await notificationService.createNotification(notificationData);
    res.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
}; 