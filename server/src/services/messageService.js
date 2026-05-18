const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

exports.getAllMessages = async (userId) => {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    const messages = await messagesCollection.find({
      $or: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    }).toArray();
    
    return messages;
  } catch (error) {
    console.error('Error in getAllMessages:', error);
    throw error;
  }
};

exports.getMessageById = async (id) => {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    let message = null;
    
    // Try to find by _id directly (for UUID objects)
    message = await messagesCollection.findOne({ _id: id });
    
    // If not found and id is a string, try to create UUID from string
    if (!message && typeof id === 'string') {
      try {
        const uuidFromString = new UUID(id);
        message = await messagesCollection.findOne({ _id: uuidFromString });
      } catch (uuidError) {
        console.log('UUID conversion failed:', uuidError.message);
      }
    }
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    return message;
  } catch (error) {
    console.error('Error in getMessageById:', error);
    throw error;
  }
};

exports.createMessage = async (message) => {
  try {
    console.log('createMessage called with:', message);
    
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    // Convert string IDs to UUID objects
    let senderIdUUID, receiverIdUUID;
    try {
      senderIdUUID = new UUID(message.sender_id);
      receiverIdUUID = new UUID(message.receiver_id);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    // Generate new UUID for the message
    const messageId = new UUID();
    
    const newMessage = {
      _id: messageId,
      sender_id: senderIdUUID,
      receiver_id: receiverIdUUID,
      content: message.content,
      imageUrl: message.imageUrl || null,
      status: message.status || 'sent',
      emotion: message.emotion || null,
      created_at: new Date().toISOString()
    };
    
    console.log('Creating message with UUIDs:', { senderIdUUID, receiverIdUUID });
    
    const result = await messagesCollection.insertOne(newMessage);
    const createdMessage = { ...newMessage, _id: result.insertedId };
    
    console.log('Message created successfully:', createdMessage._id);
    
    // Transform to match client expectations
    return {
      id: createdMessage._id.toString(),
      sender_id: createdMessage.sender_id.toString(),
      receiver_id: createdMessage.receiver_id.toString(),
      content: createdMessage.content,
      created_at: createdMessage.created_at,
      status: createdMessage.status,
      emotion: createdMessage.emotion,
      imageUrl: createdMessage.imageUrl
    };
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw error;
  }
};

exports.updateMessage = async (id, updates, currentUserId) => {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    // First check if the message belongs to the current user
    let message = await this.getMessageById(id);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Only allow editing own messages
    if (message.sender_id !== currentUserId) {
      throw new Error('Unauthorized: You can only edit your own messages');
    }
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const result = await messagesCollection.updateOne(
      { _id: message._id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Message not found');
    }
    
    // Get updated message
    const updatedMessage = await messagesCollection.findOne({ _id: message._id });
    return updatedMessage;
  } catch (error) {
    console.error('Error in updateMessage:', error);
    throw error;
  }
};

exports.deleteMessage = async (id, currentUserId) => {
  try {
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    // First check if the message belongs to the current user
    let message = await this.getMessageById(id);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Only allow deleting own messages
    if (message.sender_id !== currentUserId) {
      throw new Error('Unauthorized: You can only delete your own messages');
    }
    
    const result = await messagesCollection.deleteOne({ _id: message._id });
    
    if (result.deletedCount === 0) {
      throw new Error('Message not found');
    }
    
    return { id, success: true };
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw error;
  }
};

exports.getMessagesByUser = async (currentUserId, userId, page = 1, limit = 50) => {
  try {
    console.log('getMessagesByUser called with:', { currentUserId, userId, page, limit });
    
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    const offset = (page - 1) * limit;
    
    // Convert string IDs to UUID objects for MongoDB query
    let currentUserIdUUID, userIdUUID;
    try {
      currentUserIdUUID = new UUID(currentUserId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    console.log('Querying messages with UUIDs:', { currentUserIdUUID, userIdUUID });
    
    const messages = await messagesCollection.find({
      $or: [
        { sender_id: currentUserIdUUID, receiver_id: userIdUUID },
        { sender_id: userIdUUID, receiver_id: currentUserIdUUID }
      ]
    })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
    
    console.log(`Found ${messages.length} messages`);
    
    // Transform messages to match client expectations
    const transformedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      sender_id: msg.sender_id.toString(),
      receiver_id: msg.receiver_id.toString(),
      content: msg.content,
      created_at: msg.created_at,
      read_at: msg.read_at,
      status: msg.status,
      emotion: msg.emotion,
      imageUrl: msg.imageUrl
    }));
    
    const result = {
      userId,
      messages: transformedMessages.reverse(),
      hasMore: transformedMessages.length === limit,
      page
    };
    
    console.log('Returning result:', result);
    return result;
  } catch (error) {
    console.error('Error in getMessagesByUser:', error);
    throw error;
  }
};

exports.markAsRead = async (currentUserId, userId) => {
  try {
    console.log('markAsRead called with:', { currentUserId, userId });
    
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    // Convert string IDs to UUID objects
    let currentUserIdUUID, userIdUUID;
    try {
      currentUserIdUUID = new UUID(currentUserId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    console.log('Updating with UUIDs:', { currentUserIdUUID, userIdUUID });
    
    const result = await messagesCollection.updateMany(
      {
        sender_id: userIdUUID,
        receiver_id: currentUserIdUUID,
        read_at: null
      },
      {
        $set: {
          read_at: new Date().toISOString(),
          status: 'read'
        }
      }
    );
    
    console.log('Updated messages count:', result.modifiedCount);
    
    return { updatedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

exports.fetchConnectedUsers = async (userId) => {
  try {
    console.log('fetchConnectedUsers called with userId:', userId);
    
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    const profilesCollection = db.collection('profiles');
    
    // Convert string userId to UUID object
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    console.log('Querying with UUID:', userIdUUID);
    
    // Get all users the current user has exchanged messages with
    const conversations = await messagesCollection.aggregate([
      {
        $match: {
          $or: [
            { sender_id: userIdUUID },
            { receiver_id: userIdUUID }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender_id', userIdUUID] },
              '$receiver_id',
              '$sender_id'
            ]
          },
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$created_at' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver_id', userIdUUID] },
                    { $eq: ['$read_at', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]).toArray();
    
    console.log('Found conversations:', conversations.length);
    
    // Get profile information for each user
    const connectedUsers = [];
    for (const conv of conversations) {
      try {
        const profile = await profilesCollection.findOne({ _id: conv._id });
        if (profile) {
          connectedUsers.push({
            userId: conv._id.toString(),
            userName: profile.name || 'Unknown User',
            photo_url: profile.photo_url || '',
            lastMessage: conv.lastMessage || '',
            lastMessageTime: conv.lastMessageTime,
            unReadCount: conv.unreadCount || 0
          });
        }
      } catch (profileError) {
        console.log('Profile not found for user:', conv._id);
      }
    }
    
    console.log('Returning connected users:', connectedUsers.length);
    return connectedUsers;
  } catch (error) {
    console.error('Error in fetchConnectedUsers:', error);
    throw error;
  }
};

exports.fetchUnreadMessageCounts = async (userId) => {
  try {
    console.log('fetchUnreadMessageCounts called with userId:', userId);
    
    const db = await getDatabase();
    const messagesCollection = db.collection('messages');
    
    // Convert string userId to UUID object
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    console.log('Querying with UUID:', userIdUUID);
    
    // Aggregate to get unread message counts for each sender
    const unreadCounts = await messagesCollection.aggregate([
      {
        $match: {
          receiver_id: userIdUUID,
          read_at: null
        }
      },
      {
        $group: {
          _id: '$sender_id',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('Found unread counts:', unreadCounts);
    
    // Convert to object format { senderId: count }
    const result = {};
    unreadCounts.forEach(item => {
      result[item._id.toString()] = item.count;
    });
    
    console.log('Returning unread counts:', result);
    return result;
  } catch (error) {
    console.error('Error in fetchUnreadMessageCounts:', error);
    throw error;
  }
};

exports.uploadImage = async (file, senderId) => {
  try {
    // TODO: Implement image upload to your preferred storage solution
    // For now, return a placeholder URL
    console.log('Image upload requested:', { fileName: file.originalname, senderId });
    
    // You can implement:
    // - AWS S3
    // - Cloudinary
    // - Local file system
    // - Or keep Supabase storage if needed
    
    return `https://placeholder.com/chat-images/${senderId}/${Date.now()}_${file.originalname}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 