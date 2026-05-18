const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

exports.addFriend = async (userId, friendId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    
    // Convert string IDs to UUIDs if needed
    let userIdUUID, friendIdUUID;
    try {
      userIdUUID = new UUID(userId);
      friendIdUUID = new UUID(friendId);
    } catch (uuidError) {
      userIdUUID = userId;
      friendIdUUID = friendId;
    }
    
    // Check if already friends
    const existingFriend = await friendsCollection.findOne({
      $or: [
        { user_id: userIdUUID, friend_id: friendIdUUID },
        { user_id: friendIdUUID, friend_id: userIdUUID }
      ]
    });
    
    if (existingFriend) {
      throw new Error('Already friends');
    }
    
    // Generate new UUID for the friend relationship
    const friendRelationshipId = new UUID();
    
    // Add friend relationship
    const newFriend = {
      _id: friendRelationshipId,
      user_id: userIdUUID,
      friend_id: friendIdUUID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await friendsCollection.insertOne(newFriend);
    
    return { friendId, success: true };
  } catch (error) {
    console.error('Error in addFriend:', error);
    throw new Error(error.message);
  }
};

exports.removeFriend = async (userId, friendId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    
    // Convert string IDs to UUIDs if needed
    let userIdUUID, friendIdUUID;
    try {
      userIdUUID = new UUID(userId);
      friendIdUUID = new UUID(friendId);
    } catch (uuidError) {
      userIdUUID = userId;
      friendIdUUID = friendId;
    }
    
    const result = await friendsCollection.deleteOne({
      $or: [
        { user_id: userIdUUID, friend_id: friendIdUUID },
        { user_id: friendIdUUID, friend_id: userIdUUID }
      ]
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Friend relationship not found');
    }
    
    return { friendId, success: true };
  } catch (error) {
    console.error('Error in removeFriend:', error);
    throw new Error(error.message);
  }
};

exports.getFriends = async (userId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const friends = await friendsCollection.find({
      user_id: userIdUUID
    }).toArray();
    
    // Get profiles for all friends
    const friendProfiles = await Promise.all(
      friends.map(async (friend) => {
        try {
          const profile = await profilesCollection.findOne({ _id: friend.friend_id });
          return profile ? {
            ...profile,
            id: profile._id.toString(),
            friend_id: friend.friend_id.toString()
          } : null;
        } catch (error) {
          console.error('Error fetching friend profile:', error);
          return null;
        }
      })
    );
    
    return { friends: friendProfiles.filter(profile => profile !== null) };
  } catch (error) {
    console.error('Error in getFriends:', error);
    throw new Error(error.message);
  }
};

exports.getFriendsList = async (userId, targetUserId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    const profilesCollection = db.collection('profiles');
    
    // Convert string IDs to UUIDs if needed
    let userIdUUID, targetUserIdUUID;
    try {
      userIdUUID = new UUID(userId);
      targetUserIdUUID = new UUID(targetUserId || userId);
    } catch (uuidError) {
      userIdUUID = userId;
      targetUserIdUUID = targetUserId || userId;
    }
    
    const queryUserId = targetUserId || userId;
    
    const friends = await friendsCollection.find({
      user_id: targetUserIdUUID
    }).toArray();
    
    // Get profiles for all friends
    const friendProfiles = await Promise.all(
      friends.map(async (friend) => {
        try {
          const profile = await profilesCollection.findOne({ _id: friend.friend_id });
          return profile ? {
            ...profile,
            id: profile._id.toString(),
            friend_id: friend.friend_id.toString()
          } : null;
        } catch (error) {
          console.error('Error fetching friend profile:', error);
          return null;
        }
      })
    );
    
    return { friends: friendProfiles.filter(profile => profile !== null) };
  } catch (error) {
    console.error('Error in getFriendsList:', error);
    throw new Error(error.message);
  }
};

exports.checkIsFriend = async (userId, friendId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    
    // Convert string IDs to UUIDs if needed
    let userIdUUID, friendIdUUID;
    try {
      userIdUUID = new UUID(userId);
      friendIdUUID = new UUID(friendId);
    } catch (uuidError) {
      userIdUUID = userId;
      friendIdUUID = friendId;
    }
    
    const friend = await friendsCollection.findOne({
      $or: [
        { user_id: userIdUUID, friend_id: friendIdUUID },
        { user_id: friendIdUUID, friend_id: userIdUUID }
      ]
    });
    
    return !!friend;
  } catch (error) {
    console.error('Error in checkIsFriend:', error);
    throw new Error(error.message);
  }
};

exports.getFriendsCount = async (userId) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const count = await friendsCollection.countDocuments({
      user_id: userIdUUID
    });
    
    return count || 0;
  } catch (error) {
    console.error('Error in getFriendsCount:', error);
    throw new Error(error.message);
  }
};

exports.getMutualFriends = async (userId1, userId2) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    const profilesCollection = db.collection('profiles');
    
    // Convert string IDs to UUIDs if needed
    let userId1UUID, userId2UUID;
    try {
      userId1UUID = new UUID(userId1);
      userId2UUID = new UUID(userId2);
    } catch (uuidError) {
      userId1UUID = userId1;
      userId2UUID = userId2;
    }
    
    // Get friends of user1
    const user1Friends = await friendsCollection.find({
      user_id: userId1UUID
    }).toArray();
    
    const user1FriendIds = user1Friends.map(friend => friend.friend_id);
    
    // Get friends of user2
    const user2Friends = await friendsCollection.find({
      user_id: userId2UUID
    }).toArray();
    
    const user2FriendIds = user2Friends.map(friend => friend.friend_id);
    
    // Find mutual friends
    const mutualFriendIds = user1FriendIds.filter(id => 
      user2FriendIds.some(user2Id => user2Id.toString() === id.toString())
    );
    
    // Get profiles for mutual friends
    const mutualFriendProfiles = await Promise.all(
      mutualFriendIds.map(async (friendId) => {
        try {
          const profile = await profilesCollection.findOne({ _id: friendId });
          return profile ? {
            ...profile,
            id: profile._id.toString()
          } : null;
        } catch (error) {
          console.error('Error fetching mutual friend profile:', error);
          return null;
        }
      })
    );
    
    return mutualFriendProfiles.filter(profile => profile !== null);
  } catch (error) {
    console.error('Error in getMutualFriends:', error);
    throw new Error(error.message);
  }
}; 