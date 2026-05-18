const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Socket.io instance (will be set from outside)
let io = null;

// Function to set Socket.io instance
const setSocketIO = (socketIO) => {
  io = socketIO;
  console.log('Socket.io instance set in activityService:', !!io);
};

exports.getAllActivities = async () => {
  try {
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');
    const participantsCollection = db.collection('activity_participants');
    const profilesCollection = db.collection('profiles');
    
    const activities = await activitiesCollection.find({}).toArray();
    
    // Fetch participants for each activity
    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        try {
          const participants = await participantsCollection.find({
            activity_id: activity._id
          }).toArray();
          
          // Get participant profiles
          const participantsWithProfiles = await Promise.all(
            participants.map(async (participant) => {
              try {
                const profile = await profilesCollection.findOne({ _id: participant.user_id });
                return {
                  ...participant,
                  user: profile ? {
                    id: profile._id.toString(),
                    name: profile.name,
                    photo_url: profile.photo_url
                  } : null
                };
              } catch (profileError) {
                console.log('Profile not found for participant:', participant.user_id);
                return participant;
              }
            })
          );
          
          return {
            ...activity,
            id: activity._id.toString(),
            creator_id: activity.creator_id.toString(),
            participants: participantsWithProfiles || []
          };
        } catch (participantsError) {
          console.log('Error fetching participants for activity:', activity._id);
          return {
            ...activity,
            id: activity._id.toString(),
            creator_id: activity.creator_id.toString(),
            participants: []
          };
        }
      })
    );
    
    return activitiesWithParticipants;
  } catch (error) {
    console.error('Error in getAllActivities:', error);
    throw error;
  }
};

exports.getActivityById = async (id) => {
  try {
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');
    const participantsCollection = db.collection('activity_participants');
    const profilesCollection = db.collection('profiles');
    
    let activity = null;
    
    // Try to find by _id directly (for UUID objects)
    try {
      const uuidFromString = new UUID(id);
      activity = await activitiesCollection.findOne({ _id: uuidFromString });
    } catch (uuidError) {
      console.log('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid activity ID format');
    }
    
    if (!activity) {
      throw new Error('Activity not found');
    }
    
    // Get creator profile
    let creator = null;
    try {
      const creatorProfile = await profilesCollection.findOne({ _id: activity.creator_id });
      if (creatorProfile) {
        creator = {
          id: creatorProfile._id.toString(),
          name: creatorProfile.name,
          photo_url: creatorProfile.photo_url
        };
      }
    } catch (creatorError) {
      console.log('Creator profile not found:', creatorError.message);
    }
    
    // Fetch participants for the activity
    const participants = await participantsCollection.find({
      activity_id: activity._id
    }).toArray();
    
    // Get participant profiles
    const participantsWithProfiles = await Promise.all(
      participants.map(async (participant) => {
        try {
          const profile = await profilesCollection.findOne({ _id: participant.user_id });
          return {
            ...participant,
            user: profile ? {
              id: profile._id.toString(),
              name: profile.name,
              photo_url: profile.photo_url
            } : null
          };
        } catch (profileError) {
          console.log('Profile not found for participant:', participant.user_id);
          return participant;
        }
      })
    );
    
    return {
      ...activity,
      id: activity._id.toString(),
      creator_id: activity.creator_id.toString(),
      creator,
      participants: participantsWithProfiles || []
    };
  } catch (error) {
    console.error('Error in getActivityById:', error);
    throw error;
  }
};

exports.createActivity = async (activity) => {
  try {
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');
    
    // Convert string IDs to UUID objects
    let creatorIdUUID;
    try {
      creatorIdUUID = new UUID(activity.creator_id);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid creator ID format');
    }
    
    // Generate new UUID for the activity
    const activityId = new UUID();
    
    const newActivity = {
      _id: activityId,
      ...activity,
      creator_id: creatorIdUUID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await activitiesCollection.insertOne(newActivity);
    const createdActivity = { ...newActivity, _id: result.insertedId };
    
    console.log('Activity created:', createdActivity._id);
    
    // Notify friends about new activity
    try {
      console.log('Starting notification process...');
      await notifyFriendsAboutActivity(createdActivity);
      console.log('Notification process completed');
    } catch (notificationError) {
      console.error('Error notifying friends about activity:', notificationError);
      // Don't throw error to avoid breaking activity creation
    }
    
    return {
      ...createdActivity,
      id: createdActivity._id.toString(),
      creator_id: createdActivity.creator_id.toString(),
      participants: []
    };
  } catch (error) {
    console.error('Error in createActivity:', error);
    throw error;
  }
};

// Helper function to create notification
const createNotification = async (type, fromUserId, toUserId, content, metadata = null) => {
  try {
    console.log('Creating notification in activityService:', { type, fromUserId, toUserId, content, metadata });
    
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
    
    console.log('Notification created successfully in activityService:', createdNotification._id);
    
    return {
      ...createdNotification,
      id: createdNotification._id.toString(),
      from_user_id: createdNotification.from_user_id.toString(),
      to_user_id: createdNotification.to_user_id.toString()
    };
  } catch (error) {
    console.error('Error creating notification in activityService:', error);
    return null;
  }
};

// Function to notify friends about new activity
const notifyFriendsAboutActivity = async (activity) => {
  try {
    console.log('=== ACTIVITY NOTIFICATION DEBUG ===');
    console.log('Starting notification process for activity:', activity._id);
    console.log('Activity creator ID:', activity.creator_id);
    console.log('Activity title:', activity.title);
    
    // Get creator's name
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const creatorProfile = await profilesCollection.findOne({ _id: activity.creator_id });
    
    if (!creatorProfile) {
      console.error('Error fetching creator profile:', 'Profile not found');
      return;
    }

    const creatorName = creatorProfile.name || 'Someone';
    const content = `${creatorName} created a new activity: ${activity.title}`;
    console.log('Creator name:', creatorName);
    console.log('Notification content:', content);

    // Get the creator's connected friends (simplified approach)
    console.log('Fetching connections for creator ID:', activity.creator_id);
    const connectionsCollection = db.collection('connections');
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: activity.creator_id, status: 'accepted' },
        { receiver_id: activity.creator_id, status: 'accepted' }
      ]
    }).toArray();
    
    if (connections.length === 0) {
      console.log('No connected friends found for activity creator');
      console.log('=== END ACTIVITY NOTIFICATION DEBUG ===');
      return;
    }

    console.log('Found connections:', connections);
    console.log('Number of connections:', connections.length);

    // Notify each connected friend (EXCLUDING the activity creator)
    for (const connection of connections) {
      const friendId = connection.sender_id === activity.creator_id 
        ? connection.receiver_id 
        : connection.sender_id;
      
      // Skip if the friend is the same as the activity creator
      if (friendId.toString() === activity.creator_id.toString()) {
        console.log('Skipping notification to activity creator:', friendId);
        continue;
      }
      
      console.log('Sending notification to friend ID:', friendId);
      console.log('Notification content:', content);
      console.log('Activity details:', { id: activity._id, title: activity.title, creator_id: activity.creator_id });
      
      const notification = await createNotification(
        'activity_created',
        activity.creator_id,
        friendId,
        content,
        {
          activity_id: activity._id,
          activity_title: activity.title
        }
      );
      
      if (notification) {
        console.log('Notification created successfully for friend:', friendId);
        
        // Emit real-time notification if Socket.io is available
        if (io) {
          io.to(friendId.toString()).emit('notification:new', notification);
        }
      } else {
        console.log('Failed to create notification for friend:', friendId);
      }
    }
    
    console.log('=== END ACTIVITY NOTIFICATION DEBUG ===');
  } catch (error) {
    console.error('Error in notifyFriendsAboutActivity:', error);
  }
};

const notifyFriendsAboutActivityUpdate = async (activity) => {
  try {
    console.log('Starting update notification process for activity:', activity._id);
    console.log('Activity creator ID:', activity.creator_id);
    
    // Get creator's name
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const creatorProfile = await profilesCollection.findOne({ _id: activity.creator_id });
    
    if (!creatorProfile) {
      console.error('Error fetching creator profile:', 'Profile not found');
      return;
    }

    const creatorName = creatorProfile.name || 'Someone';
    const content = `${creatorName} updated their activity: ${activity.title}`;

    // Get the creator's connected friends (simplified approach)
    const connectionsCollection = db.collection('connections');
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: activity.creator_id, status: 'accepted' },
        { receiver_id: activity.creator_id, status: 'accepted' }
      ]
    }).toArray();
    
    if (connections.length === 0) {
      console.log('No connected friends found for activity update');
      return;
    }

    console.log('Found connections for update notification:', connections);

    // Notify each connected friend (EXCLUDING the activity creator)
    for (const connection of connections) {
      const friendId = connection.sender_id === activity.creator_id 
        ? connection.receiver_id 
        : connection.sender_id;
      
      // Skip if the friend is the same as the activity creator
      if (friendId.toString() === activity.creator_id.toString()) {
        console.log('Skipping update notification to activity creator:', friendId);
        continue;
      }
      
      const notification = await createNotification(
        'activity_updated',
        activity.creator_id,
        friendId,
        content,
        {
          activity_id: activity._id,
          activity_title: activity.title
        }
      );
      
      if (notification && io) {
        io.to(friendId.toString()).emit('notification:new', notification);
      }
    }
  } catch (error) {
    console.error('Error in notifyFriendsAboutActivityUpdate:', error);
  }
};

const notifyFriendsAboutActivityDeletion = async (activity) => {
  try {
    console.log('=== ACTIVITY DELETION NOTIFICATION DEBUG ===');
    console.log('Starting deletion notification process for activity:', activity._id);
    console.log('Activity creator ID:', activity.creator_id);
    console.log('Activity title:', activity.title);
    
    // Get creator's name
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const creatorProfile = await profilesCollection.findOne({ _id: activity.creator_id });
    
    if (!creatorProfile) {
      console.error('Error fetching creator profile:', 'Profile not found');
      return;
    }

    const creatorName = creatorProfile.name || 'Someone';
    const content = `${creatorName} deleted their activity: ${activity.title}`;
    console.log('Creator name:', creatorName);
    console.log('Deletion notification content:', content);

    // Get the creator's connected friends (like activity creation/update)
    console.log('Fetching connections for creator ID:', activity.creator_id);
    const connectionsCollection = db.collection('connections');
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: activity.creator_id, status: 'accepted' },
        { receiver_id: activity.creator_id, status: 'accepted' }
      ]
    }).toArray();
    
    if (connections.length === 0) {
      console.log('No connected friends found for activity deletion');
      console.log('=== END ACTIVITY DELETION NOTIFICATION DEBUG ===');
      return;
    }

    console.log('Found connections for deletion notification:', connections);
    console.log('Number of connections:', connections.length);

    // Notify each connected friend (EXCLUDING the activity creator)
    for (const connection of connections) {
      const friendId = connection.sender_id === activity.creator_id 
        ? connection.receiver_id 
        : connection.sender_id;
      
      // Skip if the friend is the same as the activity creator
      if (friendId.toString() === activity.creator_id.toString()) {
        console.log('Skipping deletion notification to activity creator:', friendId);
        continue;
      }
      
      console.log('Sending deletion notification to friend ID:', friendId);
      console.log('Deletion notification content:', content);
      console.log('Activity details:', { id: activity._id, title: activity.title, creator_id: activity.creator_id });
      
      const notification = await createNotification(
        'activity_deleted',
        activity.creator_id,
        friendId,
        content,
        {
          activity_id: activity._id,
          activity_title: activity.title
        }
      );
      
      if (notification) {
        console.log('Deletion notification created successfully for friend:', friendId);
        
        // Emit real-time notification if Socket.io is available
        if (io) {
          io.to(friendId.toString()).emit('notification:new', notification);
        }
      } else {
        console.log('Failed to create deletion notification for friend:', friendId);
      }
    }
    
    console.log('=== END ACTIVITY DELETION NOTIFICATION DEBUG ===');
  } catch (error) {
    console.error('Error in notifyFriendsAboutActivityDeletion:', error);
  }
};

// Export the setSocketIO function
exports.setSocketIO = setSocketIO;

exports.updateActivity = async (id, updates) => {
  try {
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');

    let activityIdUUID;
    try {
      activityIdUUID = new UUID(id);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid activity ID format');
    }

    const result = await activitiesCollection.updateOne(
      { _id: activityIdUUID }, 
      { $set: { ...updates, updated_at: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Activity not found');
    }
    
    // Get updated activity
    const updatedActivity = await activitiesCollection.findOne({ _id: activityIdUUID });
    
    // Notify friends about activity update
    try {
      console.log('Starting update notification process...');
      await notifyFriendsAboutActivityUpdate(updatedActivity);
      console.log('Update notification process completed');
    } catch (notificationError) {
      console.error('Error notifying friends about activity update:', notificationError);
      // Don't throw error to avoid breaking activity update
    }
    
    return updatedActivity;
  } catch (error) {
    console.error('Error in updateActivity:', error);
    throw error;
  }
};

exports.deleteActivity = async (id) => {
  try {
    // Get activity details before deletion for notifications
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');

    // Handle both MongoDB ObjectId and UUID
    let activityIdForQuery;
    try {
      // Try to convert to UUID first
      activityIdForQuery = new UUID(id);
    } catch (uuidError) {
      // If not a valid UUID, try to convert to ObjectId
      try {
        const { ObjectId } = require('mongodb');
        activityIdForQuery = new ObjectId(id);
      } catch (objectIdError) {
        // If both fail, use the string directly
        activityIdForQuery = id;
      }
    }

    console.log('Searching for activity with ID:', id);
    console.log('Query ID type:', typeof activityIdForQuery, 'Value:', activityIdForQuery);
    
    const activity = await activitiesCollection.findOne({ _id: activityIdForQuery });
    
    if (!activity) {
      console.log('Activity not found with query ID:', activityIdForQuery);
      // Try to find with string ID as fallback
      const fallbackActivity = await activitiesCollection.findOne({ _id: id });
      if (fallbackActivity) {
        console.log('Found activity with fallback string ID');
        activity = fallbackActivity;
      } else {
        throw new Error('Activity not found');
      }
    }
    
    // Get participants to notify them about deletion
    const participantsCollection = db.collection('activity_participants');
    const participants = await participantsCollection.find({ activity_id: activityIdForQuery }).toArray();
    
    if (participants.length > 0) {
      console.log('Found participants for deletion notification:', participants.length);
    }
    
    // Delete the activity
    const result = await activitiesCollection.deleteOne({ _id: activityIdForQuery });
    
    if (result.deletedCount === 0) {
      throw new Error('Activity not found');
    }
    
    // Notify friends about activity deletion (like activity creation/update notifications)
    try {
      console.log('Starting deletion notification process for activity:', id);
      await notifyFriendsAboutActivityDeletion(activity);
      console.log('Deletion notification process completed');
    } catch (notificationError) {
      console.error('Error notifying friends about activity deletion:', notificationError);
      // Don't throw error to avoid breaking activity deletion
    }
    
    return { message: 'Activity deleted successfully' };
  } catch (error) {
    console.error('Error in deleteActivity:', error);
    throw error;
  }
};

exports.uploadActivityImage = async (file) => {
  try {
    // For now, return a placeholder URL
    // In production, you would upload to a cloud storage service
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Return a placeholder URL - replace with actual cloud storage logic
    return `https://placeholder.com/activity-images/${fileName}`;
  } catch (error) {
    console.error('Error in uploadActivityImage:', error);
    throw error;
  }
};

exports.getActivities = async (filters = {}) => {
  try {
    const db = await getDatabase();
    const activitiesCollection = db.collection('activities');
    const profilesCollection = db.collection('profiles');

    let query = activitiesCollection.find({});

    if (filters.type && filters.type.length) {
      query = query.filter({ type: { $in: filters.type } });
    }
    if (filters.date) {
      query = query.filter({ start_datetime: filters.date });
    }
    if (filters.searchQuery) {
      query = query.filter({
        $or: [
          { title: { $regex: filters.searchQuery, $options: 'i' } },
          { description: { $regex: filters.searchQuery, $options: 'i' } },
          { location: { $regex: filters.searchQuery, $options: 'i' } }
        ]
      });
    }
    if (filters.privacy) {
      query = query.filter({ privacy: filters.privacy });
    }

    const activities = await query.sort({ start_datetime: 1 }).toArray();
    
    if (activities.length === 0) {
      return [];
    }

    // Fetch participants for each activity
    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        const participantsCollection = db.collection('activity_participants');
        const participants = await participantsCollection.find({ activity_id: activity._id }).toArray();
        const participantsWithProfiles = await Promise.all(
          participants.map(async (participant) => {
            const profile = await profilesCollection.findOne({ _id: participant.user_id });
            return {
              ...participant,
              user: profile ? {
                id: profile._id.toString(),
                name: profile.name,
                photo_url: profile.photo_url
              } : null
            };
          })
        );
        return {
          ...activity,
          id: activity._id.toString(),
          creator_id: activity.creator_id.toString(),
          participants: participantsWithProfiles || []
        };
      })
    );
    return activitiesWithParticipants;
  } catch (error) {
    console.error('Error in getActivities:', error);
    throw error;
  }
};

exports.inviteParticipants = async (activityId, userIds) => {
  try {
    const db = await getDatabase();
    const participantsCollection = db.collection('activity_participants');

    let activityIdUUID;
    try {
      activityIdUUID = new UUID(activityId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid activity ID format');
    }

    const participants = userIds.map(userId => {
      // Generate new UUID for each participant
      const participantId = new UUID();
      
      return {
        _id: participantId,
        activity_id: activityIdUUID,
        user_id: new UUID(userId),
        status: 'invited',
        created_at: new Date().toISOString()
      };
    });
    
    const result = await participantsCollection.insertMany(participants);
    return result.insertedIds;
  } catch (error) {
    console.error('Error in inviteParticipants:', error);
    throw error;
  }
};

exports.updateParticipantStatus = async (activityId, userId, status) => {
  try {
    const db = await getDatabase();
    const participantsCollection = db.collection('activity_participants');

    let activityIdUUID, userIdUUID;
    try {
      activityIdUUID = new UUID(activityId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid ID format');
    }

    const result = await participantsCollection.updateOne(
      { activity_id: activityIdUUID, user_id: userIdUUID }, 
      {
        $set: {
          status,
          joined_at: status === 'accepted' || status === 'joined' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Participant not found');
    }
    
    return { success: true, updatedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error in updateParticipantStatus:', error);
    throw error;
  }
};

exports.getSuggestedActivities = async (userId) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const activitiesCollection = db.collection('activities');
    const participantsCollection = db.collection('activity_participants');

    // Get user's interests
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      console.error('UUID conversion failed:', uuidError.message);
      throw new Error('Invalid user ID format');
    }
    
    const profile = await profilesCollection.findOne({ _id: userIdUUID });
    if (!profile) throw new Error('User not found');

    // Get activities that match user's interests
    const activities = await activitiesCollection
      .find({
        type: { $in: profile.interests || [] },
        privacy: 'public',
        start_datetime: { $gt: new Date().toISOString() }
      })
      .sort({ start_datetime: 1 })
      .limit(5)
      .toArray();
    
    if (activities.length === 0) {
      return [];
    }

    // Fetch participants for each activity
    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        const participants = await participantsCollection.find({ activity_id: activity._id }).toArray();
        const participantsWithProfiles = await Promise.all(
          participants.map(async (participant) => {
            const profile = await profilesCollection.findOne({ _id: participant.user_id });
            return {
              ...participant,
              user: profile ? {
                id: profile._id.toString(),
                name: profile.name,
                photo_url: profile.photo_url
              } : null
            };
          })
        );
        return {
          ...activity,
          id: activity._id.toString(),
          creator_id: activity.creator_id.toString(),
          participants: participantsWithProfiles || []
        };
      })
    );
    return activitiesWithParticipants;
  } catch (error) {
    console.error('Error in getSuggestedActivities:', error);
    throw error;
  }
}; 