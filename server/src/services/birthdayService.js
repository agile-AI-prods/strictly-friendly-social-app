const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Get upcoming birthdays for user's connections
exports.getUpcomingBirthdays = async (userId, days = 30) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get user's accepted connections
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Get IDs of connected users
    const connectedUserIds = connections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    if (connectedUserIds.length === 0) {
      return [];
    }
    
    // Calculate date range for upcoming birthdays
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    // Get profiles of connected users with birthdays in the range
    const upcomingBirthdays = await profilesCollection.find({
      _id: { $in: connectedUserIds },
      birthday: { $exists: true, $ne: null }
    }).toArray();
    
    // Filter and sort by upcoming birthdays
    const filteredBirthdays = upcomingBirthdays
      .filter(profile => {
        if (!profile.birthday) return false;
        
        const birthday = new Date(profile.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday has passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return thisYearBirthday >= today && thisYearBirthday <= endDate;
      })
      .map(profile => {
        const birthday = new Date(profile.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday has passed this year, use next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntilBirthday = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...profile,
          id: profile._id.toString(),
          daysUntilBirthday,
          nextBirthday: thisYearBirthday
        };
      })
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    
    return filteredBirthdays;
  } catch (error) {
    console.error('Error in getUpcomingBirthdays:', error);
    throw error;
  }
};

// Get today's birthdays for user's connections
exports.getTodaysBirthdays = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get user's accepted connections
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Get IDs of connected users
    const connectedUserIds = connections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    if (connectedUserIds.length === 0) {
      return [];
    }
    
    // Get today's date
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();
    
    // Get profiles of connected users with birthdays today
    const todaysBirthdays = await profilesCollection.find({
      _id: { $in: connectedUserIds },
      birthday: { $exists: true, $ne: null }
    }).toArray();
    
    // Filter for today's birthdays
    const filteredBirthdays = todaysBirthdays
      .filter(profile => {
        if (!profile.birthday) return false;
        
        const birthday = new Date(profile.birthday);
        return birthday.getMonth() + 1 === month && birthday.getDate() === day;
      })
      .map(profile => ({
        ...profile,
        id: profile._id.toString()
      }));
    
    return filteredBirthdays;
  } catch (error) {
    console.error('Error in getTodaysBirthdays:', error);
    throw error;
  }
};

// Get birthday notifications for a user
exports.getBirthdayNotifications = async (userId) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get birthday-related notifications
    const birthdayNotifications = await notificationsCollection.find({
      user_id: userIdUUID,
      type: 'birthday'
    })
    .sort({ created_at: -1 })
    .toArray();
    
    // Transform for client (convert UUIDs to strings)
    return birthdayNotifications.map(notification => ({
      ...notification,
      id: notification._id.toString(),
      user_id: notification.user_id.toString(),
      sender_id: notification.sender_id ? notification.sender_id.toString() : null
    }));
  } catch (error) {
    console.error('Error in getBirthdayNotifications:', error);
    throw error;
  }
};

// Create birthday notification
exports.createBirthdayNotification = async (userId, senderId, message) => {
  try {
    const db = await getDatabase();
    const notificationsCollection = db.collection('notifications');
    
    // Convert string IDs to UUIDs if needed
    let userIdUUID, senderIdUUID;
    try {
      userIdUUID = new UUID(userId);
      senderIdUUID = new UUID(senderId);
    } catch (uuidError) {
      userIdUUID = userId;
      senderIdUUID = senderId;
    }
    
    // Generate new UUID for the birthday notification
    const notificationId = new UUID();
    
    const notification = {
      _id: notificationId,
      user_id: userIdUUID,
      sender_id: senderIdUUID,
      type: 'birthday',
      title: 'Birthday Wishes!',
      message: message || 'Happy Birthday! 🎉',
      read: false,
      created_at: new Date().toISOString()
    };
    
    const result = await notificationsCollection.insertOne(notification);
    const createdNotification = { ...notification, _id: result.insertedId };
    
    // Transform for client (convert UUIDs to strings)
    return {
      ...createdNotification,
      id: createdNotification._id.toString(),
      user_id: createdNotification.user_id.toString(),
      sender_id: createdNotification.sender_id.toString()
    };
  } catch (error) {
    console.error('Error in createBirthdayNotification:', error);
    throw error;
  }
};

// Get friends birthdays (legacy function for backward compatibility)
exports.getFriendsBirthdays = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get user's accepted connections
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Get IDs of connected users
    const connectedUserIds = connections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    if (connectedUserIds.length === 0) {
      return [];
    }
    
    // Get profiles of connected users with birthdays
    const friendsWithBirthdays = await profilesCollection.find({
      _id: { $in: connectedUserIds },
      birthday: { $exists: true, $ne: null }
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    return friendsWithBirthdays.map(profile => ({
      ...profile,
      id: profile._id.toString()
    }));
  } catch (error) {
    console.error('Error in getFriendsBirthdays:', error);
    throw error;
  }
};

// Get friends birthdays for a specific year
exports.getFriendsBirthdaysForYear = async (userId, year) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get user's accepted connections
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Get IDs of connected users
    const connectedUserIds = connections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    if (connectedUserIds.length === 0) {
      return [];
    }
    
    // Get profiles of connected users with birthdays
    const friendsWithBirthdays = await profilesCollection.find({
      _id: { $in: connectedUserIds },
      birthday: { $exists: true, $ne: null }
    }).toArray();
    
    // Create birthday events for the specified year
    const birthdayEvents = friendsWithBirthdays.map(profile => {
      const birthday = new Date(profile.birthday);
      const birthdayThisYear = new Date(year, birthday.getMonth(), birthday.getDate());
      
      return {
        id: `birthday-${profile._id.toString()}`,
        label: `🎂 ${profile.name}'s Birthday`,
        dateStart: birthdayThisYear.toISOString(),
        dateEnd: birthdayThisYear.toISOString(),
        description: `${profile.name} is celebrating their birthday!`,
        class: 'birthday',
        friend: {
          ...profile,
          id: profile._id.toString()
        }
      };
    });

    return birthdayEvents;
  } catch (error) {
    console.error('Error in getFriendsBirthdaysForYear:', error);
    throw error;
  }
};

// Get birthday statistics for a user
exports.getBirthdayStats = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const profilesCollection = db.collection('profiles');
    const notificationsCollection = db.collection('notifications');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get user's accepted connections
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    const connectedUserIds = connections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    // Get birthday-related statistics
    const [totalConnections, connectionsWithBirthdays, birthdayNotifications] = await Promise.all([
      connectionsCollection.countDocuments({
        $or: [
          { sender_id: userIdUUID, status: 'accepted' },
          { receiver_id: userIdUUID, status: 'accepted' }
        ]
      }),
      profilesCollection.countDocuments({
        _id: { $in: connectedUserIds },
        birthday: { $exists: true, $ne: null }
      }),
      notificationsCollection.countDocuments({
        user_id: userIdUUID,
        type: 'birthday'
      })
    ]);
    
    return {
      totalConnections: totalConnections || 0,
      connectionsWithBirthdays: connectionsWithBirthdays || 0,
      birthdayNotifications: birthdayNotifications || 0
    };
  } catch (error) {
    console.error('Error in getBirthdayStats:', error);
    throw error;
  }
}; 