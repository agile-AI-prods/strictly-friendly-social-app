const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Get notifications for a user
exports.getNotifications = async (userId) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const notifications = await notificationsCollection.find({
      to_user_id: userIdUUID
    })
    .sort({ created_at: -1 })
    .toArray();
    
    // Transform notifications to match client expectations
    return notifications.map(notification => ({
      ...notification,
      id: notification._id.toString(),
      from_user_id: notification.from_user_id.toString(),
      to_user_id: notification.to_user_id.toString()
    }));
  } catch (error) {
    console.error('Error in getNotifications:', error);
    throw error;
  }
};

// Mark notification as read
exports.markAsRead = async (notificationId, userId) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string IDs to UUID objects if needed
    let notificationIdUUID, userIdUUID;
    try {
      notificationIdUUID = new UUID(notificationId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      notificationIdUUID = notificationId;
      userIdUUID = userId;
    }
    
    // First verify the notification belongs to the user
    const notification = await notificationsCollection.findOne({
      _id: notificationIdUUID,
      to_user_id: userIdUUID
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    // Update the notification
    const result = await notificationsCollection.updateOne(
      { _id: notificationIdUUID },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Notification not found');
    }
    
    // Get updated notification
    const updatedNotification = await notificationsCollection.findOne({ _id: notificationIdUUID });
    
    return {
      ...updatedNotification,
      id: updatedNotification._id.toString(),
      from_user_id: updatedNotification.from_user_id.toString(),
      to_user_id: updatedNotification.to_user_id.toString()
    };
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (userId) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const result = await notificationsCollection.updateMany(
      { to_user_id: userIdUUID, read: false },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );
    
    console.log(`Marked ${result.modifiedCount} notifications as read`);
    return true;
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    throw error;
  }
};

// Delete notification
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Handle both MongoDB ObjectId and UUID
    let notificationIdForQuery, userIdForQuery;
    try {
      // Try to convert to UUID first
      notificationIdForQuery = new UUID(notificationId);
    } catch (uuidError) {
      // If not a valid UUID, try to convert to ObjectId
      try {
        const { ObjectId } = require('mongodb');
        notificationIdForQuery = new ObjectId(notificationId);
      } catch (objectIdError) {
        // If both fail, use the string directly
        notificationIdForQuery = notificationId;
      }
    }
    
    try {
      userIdForQuery = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, try to convert to ObjectId
      try {
        const { ObjectId } = require('mongodb');
        userIdForQuery = new ObjectId(userId);
      } catch (objectIdError) {
        // If both fail, use the string directly
        userIdForQuery = userId;
      }
    }
    
    // First verify the notification belongs to the user
    const notification = await notificationsCollection.findOne({
      _id: notificationIdForQuery,
      to_user_id: userIdForQuery
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    // Delete the notification
    const result = await notificationsCollection.deleteOne({ _id: notificationIdForQuery });
    
    if (result.deletedCount === 0) {
      throw new Error('Failed to delete notification');
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw error;
  }
};

// Create notification
exports.createNotification = async (notificationData) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string IDs to UUID objects if needed
    let fromUserIdUUID, toUserIdUUID;
    try {
      fromUserIdUUID = new UUID(notificationData.from_user_id);
      toUserIdUUID = new UUID(notificationData.to_user_id);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      fromUserIdUUID = notificationData.from_user_id;
      toUserIdUUID = notificationData.to_user_id;
    }
    
    // Generate new UUID for the notification
    const notificationId = new UUID();
    
    const notification = {
      _id: notificationId,
      ...notificationData,
      from_user_id: fromUserIdUUID,
      to_user_id: toUserIdUUID,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await notificationsCollection.insertOne(notification);
    const createdNotification = { ...notification, _id: result.insertedId };
    
    return {
      ...createdNotification,
      id: createdNotification._id.toString(),
      from_user_id: createdNotification.from_user_id.toString(),
      to_user_id: createdNotification.to_user_id.toString()
    };
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
}; 