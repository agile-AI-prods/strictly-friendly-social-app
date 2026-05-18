const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Socket.io instance (will be set from outside)
let io = null;

// Function to set Socket.io instance
const setSocketIO = (socketIO) => {
    io = socketIO;
    console.log('Socket.io instance set in likeService');
};

// Helper function to create notification
const createNotification = async (type, fromUserId, toUserId, content, metadata = null) => {
  try {
    console.log('Creating notification in likeService:', { type, fromUserId, toUserId, content, metadata });
    
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');

    // Convert string IDs to UUID objects if needed
    let fromUserIdUUID, toUserIdUUID;
    try {
      fromUserIdUUID = new UUID(fromUserId);
      toUserIdUUID = new UUID(toUserId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      fromUserIdUUID = fromUserId;
      toUserIdUUID = toUserId;
    }

    const notification = {
      type,
      from_user_id: fromUserIdUUID,
      to_user_id: toUserIdUUID,
      content,
      metadata,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await notificationsCollection.insertOne(notification);
    const createdNotification = { ...notification, _id: result.insertedId };
    
    console.log('Notification created successfully in likeService:', createdNotification._id);
    
    return {
      ...createdNotification,
      id: createdNotification._id.toString(),
      from_user_id: createdNotification.from_user_id.toString(),
      to_user_id: createdNotification.to_user_id.toString()
    };
  } catch (error) {
    console.error('Error creating notification in likeService:', error);
    // Don't throw error to avoid breaking the like functionality
    return null;
  }
};

// Helper function to check if user has like notifications enabled
const checkLikeNotificationsEnabled = async (userId) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const settingsCollection = db.collection('settings');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    // Get user's email from profiles table
    const profile = await profilesCollection.findOne({ _id: userIdUUID });
    
    if (!profile) {
      console.error('Profile not found for like notifications check');
      return true; // Default to enabled if we can't check
    }

    // Get user's settings
    const settings = await settingsCollection.findOne({ email: profile.email });
    
    if (!settings) {
      console.log('No settings found, defaulting to enabled');
      return true; // Default to enabled if no settings found
    }

    // Return true if like_notifications is 'true', false otherwise
    const notificationsEnabled = settings.like_notifications === 'true';
    console.log('Like notifications enabled:', notificationsEnabled);
    return notificationsEnabled;
  } catch (error) {
    console.error('Error checking like notifications setting:', error);
    return true; // Default to enabled on error
  }
};

exports.likeItem = async (userId, targetId, targetType) => {
  try {
    console.log('Like item called:', { userId, targetId, targetType });
    
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, targetIdUUID;
    try {
      userIdUUID = new UUID(userId);
      targetIdUUID = new UUID(targetId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = userId;
      targetIdUUID = targetId;
    }
    
    // Check if already liked
    const existingLike = await likesCollection.findOne({
      user_id: userIdUUID,
      target_id: targetIdUUID,
      target_type: targetType
    });
    
    if (existingLike) {
      throw new Error('Already liked');
    }
    
    // Generate new UUID for the like
    const likeId = new UUID();
    
    // Create new like
    const newLike = {
      _id: likeId,
      user_id: userIdUUID,
      target_id: targetIdUUID,
      target_type: targetType,
      created_at: new Date().toISOString()
    };
    
    const result = await likesCollection.insertOne(newLike);
    const createdLike = { ...newLike, _id: result.insertedId };
    
    console.log('Like created successfully:', createdLike._id);
    
    // Create notification for activity likes
    if (targetType === 'activity' && createdLike) {
      try {
        console.log('Creating notification for activity like');
        
        // Get activity details
        const activitiesCollection = db.collection('activities');
        const activity = await activitiesCollection.findOne({ _id: targetIdUUID });
        
        if (activity && activity.creator_id.toString() !== userId) {
          console.log('Activity found, checking notifications for creator:', activity.creator_id);
          
          // Check if like notifications are enabled for the activity creator
          const notificationsEnabled = await checkLikeNotificationsEnabled(activity.creator_id.toString());
          
          if (notificationsEnabled) {
            console.log('Notifications enabled, creating notification');
            
            // Get user name who liked
            const profilesCollection = db.collection('profiles');
            const userProfile = await profilesCollection.findOne({ _id: userIdUUID });
            
            if (userProfile) {
              const userName = userProfile.name || 'Someone';
              const content = `${userName} liked your activity: ${activity.title}`;
              
              console.log('Creating notification with content:', content);
              
              // Use 'activity' type with is_like flag in metadata
              const notification = await createNotification(
                'activity',
                userId,
                activity.creator_id.toString(),
                content,
                {
                  activity_id: targetId,
                  like_id: createdLike._id.toString(),
                  target_type: 'activity',
                  is_like: true
                }
              );
              
              console.log('Notification created, sending via Socket.io');
              
              // Send real-time notification via Socket.io to specific user
              if (io && notification) {
                console.log('Emitting notification to user:', activity.creator_id.toString());
                io.to(activity.creator_id.toString()).emit('notification:new', notification);
              } else {
                console.log('Socket.io not available or notification creation failed');
              }
            }
          } else {
            console.log('Notifications disabled for this user');
          }
        } else {
          console.log('Activity not found or user is the creator');
        }
      } catch (notificationError) {
        console.error('Error creating like notification:', notificationError);
        // Don't throw error to avoid breaking the like functionality
      }
    }
    
    return {
      ...createdLike,
      id: createdLike._id.toString(),
      user_id: createdLike.user_id.toString(),
      target_id: createdLike.target_id.toString()
    };
  } catch (error) {
    console.error('Error in likeItem:', error);
    throw error;
  }
};

exports.unlikeItem = async (userId, targetId, targetType) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, targetIdUUID;
    try {
      userIdUUID = new UUID(userId);
      targetIdUUID = new UUID(targetId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = userId;
      targetIdUUID = targetId;
    }
    
    const result = await likesCollection.deleteOne({
      user_id: userIdUUID,
      target_id: targetIdUUID,
      target_type: targetType
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Like not found');
    }
    
    return { message: 'Unlike successful' };
  } catch (error) {
    console.error('Error in unlikeItem:', error);
    throw error;
  }
};

exports.getLikesCount = async (targetId, targetType) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string ID to UUID if needed
    let targetIdUUID;
    try {
      targetIdUUID = new UUID(targetId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      targetIdUUID = targetId;
    }
    
    const count = await likesCollection.countDocuments({
      target_id: targetIdUUID,
      target_type: targetType
    });
    
    return count;
  } catch (error) {
    console.error('Error in getLikesCount:', error);
    throw error;
  }
};

exports.isLiked = async (userId, targetId, targetType) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, targetIdUUID;
    try {
      userIdUUID = new UUID(userId);
      targetIdUUID = new UUID(targetId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = userId;
      targetIdUUID = targetId;
    }
    
    const like = await likesCollection.findOne({
      user_id: userIdUUID,
      target_id: targetIdUUID,
      target_type: targetType
    });
    
    return !!like;
  } catch (error) {
    console.error('Error in isLiked:', error);
    throw error;
  }
};

exports.setSocketIO = setSocketIO;

// Additional functions that were missing
exports.getAllLikes = async (userId) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const likes = await likesCollection.find({ user_id: userIdUUID }).toArray();
    
    return likes.map(like => ({
      ...like,
      id: like._id.toString(),
      user_id: like.user_id.toString(),
      target_id: like.target_id.toString()
    }));
  } catch (error) {
    console.error('Error in getAllLikes:', error);
    throw error;
  }
};

exports.getLikeById = async (likeId) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string ID to UUID if needed
    let likeIdUUID;
    try {
      likeIdUUID = new UUID(likeId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      likeIdUUID = likeId;
    }
    
    const like = await likesCollection.findOne({ _id: likeIdUUID });
    
    if (!like) {
      throw new Error('Like not found');
    }
    
    return {
      ...like,
      id: like._id.toString(),
      user_id: like.user_id.toString(),
      target_id: like.target_id.toString()
    };
  } catch (error) {
    console.error('Error in getLikeById:', error);
    throw error;
  }
};

exports.createLike = async (likeData) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, targetIdUUID;
    try {
      userIdUUID = new UUID(likeData.user_id);
      targetIdUUID = new UUID(likeData.target_id);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = likeData.user_id;
      targetIdUUID = likeData.target_id;
    }
    
    const newLike = {
      user_id: userIdUUID,
      target_id: targetIdUUID,
      target_type: likeData.target_type,
      created_at: new Date().toISOString()
    };
    
    const result = await likesCollection.insertOne(newLike);
    const createdLike = { ...newLike, _id: result.insertedId };
    
    return {
      ...createdLike,
      id: createdLike._id.toString(),
      user_id: createdLike.user_id.toString(),
      target_id: createdLike.target_id.toString()
    };
  } catch (error) {
    console.error('Error in createLike:', error);
    throw error;
  }
};

exports.updateLike = async (likeId, updateData) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string ID to UUID if needed
    let likeIdUUID;
    try {
      likeIdUUID = new UUID(likeId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      likeIdUUID = likeId;
    }
    
    const result = await likesCollection.updateOne(
      { _id: likeIdUUID },
      { $set: { ...updateData, updated_at: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Like not found');
    }
    
    // Get updated like
    const updatedLike = await likesCollection.findOne({ _id: likeIdUUID });
    
    return {
      ...updatedLike,
      id: updatedLike._id.toString(),
      user_id: updatedLike.user_id.toString(),
      target_id: updatedLike.target_id.toString()
    };
  } catch (error) {
    console.error('Error in updateLike:', error);
    throw error;
  }
};

exports.deleteLike = async (likeId) => {
  try {
    const db = await getDatabase();
    const likesCollection = db.collection('likes');
    
    // Convert string ID to UUID if needed
    let likeIdUUID;
    try {
      likeIdUUID = new UUID(likeId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      likeIdUUID = likeId;
    }
    
    const result = await likesCollection.deleteOne({ _id: likeIdUUID });
    
    if (result.deletedCount === 0) {
      throw new Error('Like not found');
    }
    
    return { message: 'Like deleted successfully' };
  } catch (error) {
    console.error('Error in deleteLike:', error);
    throw error;
  }
}; 