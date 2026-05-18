const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Get typing status for a conversation
exports.getTypingStatus = async (conversationId) => {
  try {
    const db = await getDatabase();
    const typingStatusCollection = db.collection('typing_status');
    
    // Convert string ID to UUID if needed
    let conversationIdUUID;
    try {
      conversationIdUUID = new UUID(conversationId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      conversationIdUUID = conversationId;
    }
    
    const typingUsers = await typingStatusCollection.find({
      conversation_id: conversationIdUUID,
      is_typing: true
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    return typingUsers.map(status => ({
      ...status,
      id: status._id.toString(),
      user_id: status.user_id.toString(),
      conversation_id: status.conversation_id.toString()
    }));
  } catch (error) {
    console.error('Error in getTypingStatus:', error);
    throw error;
  }
};

// Set typing status for a user in a conversation
exports.setTypingStatus = async (userId, conversationId, isTyping) => {
  try {
    const db = await getDatabase();
    const typingStatusCollection = db.collection('typing_status');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, conversationIdUUID;
    try {
      userIdUUID = new UUID(userId);
      conversationIdUUID = new UUID(conversationId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = userId;
      conversationIdUUID = conversationId;
    }
    
    const now = new Date().toISOString();
    
    if (isTyping) {
      // Set typing status to true
      await typingStatusCollection.updateOne(
        { 
          user_id: userIdUUID, 
          conversation_id: conversationIdUUID 
        },
        { 
          $set: { 
            is_typing: true, 
            last_updated: now 
          } 
        },
        { upsert: true }
      );
    } else {
      // Set typing status to false
      await typingStatusCollection.updateOne(
        { 
          user_id: userIdUUID, 
          conversation_id: conversationIdUUID 
        },
        { 
          $set: { 
            is_typing: false, 
            last_updated: now 
          } 
        },
        { upsert: true }
      );
    }
    
    return { success: true, isTyping };
  } catch (error) {
    console.error('Error in setTypingStatus:', error);
    throw error;
  }
};

// Clear typing status for a user in a conversation
exports.clearTypingStatus = async (userId, conversationId) => {
  try {
    const db = await getDatabase();
    const typingStatusCollection = db.collection('typing_status');
    
    // Convert string IDs to UUID objects if needed
    let userIdUUID, conversationIdUUID;
    try {
      userIdUUID = new UUID(userId);
      conversationIdUUID = new UUID(conversationId);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userIdUUID = userId;
      conversationIdUUID = conversationId;
    }
    
    await typingStatusCollection.updateOne(
      { 
        user_id: userIdUUID, 
        conversation_id: conversationIdUUID 
      },
      { 
        $set: { 
          is_typing: false, 
          last_updated: new Date().toISOString() 
        } 
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error in clearTypingStatus:', error);
    throw error;
  }
};

// Get all typing statuses for a user
exports.getUserTypingStatuses = async (userId) => {
  try {
    const db = await getDatabase();
    const typingStatusCollection = db.collection('typing_status');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const statuses = await typingStatusCollection.find({
      user_id: userIdUUID
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    return statuses.map(status => ({
      ...status,
      id: status._id.toString(),
      user_id: status.user_id.toString(),
      conversation_id: status.conversation_id.toString()
    }));
  } catch (error) {
    console.error('Error in getUserTypingStatuses:', error);
    throw error;
  }
};

// Clean up old typing statuses (older than 5 minutes)
exports.cleanupOldTypingStatuses = async () => {
  try {
    const db = await getDatabase();
    const typingStatusCollection = db.collection('typing_status');
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await typingStatusCollection.updateMany(
      { 
        last_updated: { $lt: fiveMinutesAgo.toISOString() },
        is_typing: true 
      },
      { 
        $set: { 
          is_typing: false 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Cleaned up ${result.modifiedCount} old typing statuses`);
    }
    
    return { success: true, cleanedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error in cleanupOldTypingStatuses:', error);
    throw error;
  }
};
