const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

exports.getAllFollows = async (userId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const follows = await followsCollection.find({
      $or: [
        { follower_id: userIdUUID },
        { following_id: userIdUUID }
      ]
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    return follows.map(follow => ({
      ...follow,
      id: follow._id.toString(),
      follower_id: follow.follower_id.toString(),
      following_id: follow.following_id.toString()
    }));
  } catch (error) {
    console.error('Error in getAllFollows:', error);
    throw new Error(error.message);
  }
};

exports.getFollowById = async (id) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let idUUID;
    try {
      idUUID = new UUID(id);
    } catch (uuidError) {
      idUUID = id;
    }
    
    const follow = await followsCollection.findOne({ _id: idUUID });
    
    if (!follow) {
      throw new Error('Follow not found');
    }
    
    // Transform for client (convert UUIDs to strings)
    return {
      ...follow,
      id: follow._id.toString(),
      follower_id: follow.follower_id.toString(),
      following_id: follow.following_id.toString()
    };
  } catch (error) {
    console.error('Error in getFollowById:', error);
    throw new Error(error.message);
  }
};

exports.createFollow = async (follow) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string IDs to UUIDs if needed
    let followerIdUUID, followingIdUUID;
    try {
      followerIdUUID = new UUID(follow.follower_id);
      followingIdUUID = new UUID(follow.following_id);
    } catch (uuidError) {
      followerIdUUID = follow.follower_id;
      followingIdUUID = follow.following_id;
    }
    
    const newFollow = {
      ...follow,
      follower_id: followerIdUUID,
      following_id: followingIdUUID,
      created_at: new Date().toISOString()
    };
    
    const result = await followsCollection.insertOne(newFollow);
    const createdFollow = { ...newFollow, _id: result.insertedId };
    
    // Transform for client (convert UUIDs to strings)
    return {
      ...createdFollow,
      id: createdFollow._id.toString(),
      follower_id: createdFollow.follower_id.toString(),
      following_id: createdFollow.following_id.toString()
    };
  } catch (error) {
    console.error('Error in createFollow:', error);
    throw new Error(error.message);
  }
};

exports.updateFollow = async (id, updates) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let idUUID;
    try {
      idUUID = new UUID(id);
    } catch (uuidError) {
      idUUID = id;
    }
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const result = await followsCollection.updateOne(
      { _id: idUUID },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Follow not found');
    }
    
    // Get updated follow
    const updatedFollow = await followsCollection.findOne({ _id: idUUID });
    
    // Transform for client (convert UUIDs to strings)
    return {
      ...updatedFollow,
      id: updatedFollow._id.toString(),
      follower_id: updatedFollow.follower_id.toString(),
      following_id: updatedFollow.following_id.toString()
    };
  } catch (error) {
    console.error('Error in updateFollow:', error);
    throw new Error(error.message);
  }
};

exports.deleteFollow = async (id) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let idUUID;
    try {
      idUUID = new UUID(id);
    } catch (uuidError) {
      idUUID = id;
    }
    
    const result = await followsCollection.deleteOne({ _id: idUUID });
    
    if (result.deletedCount === 0) {
      throw new Error('Follow not found');
    }
    
    return { success: true, id };
  } catch (error) {
    console.error('Error in deleteFollow:', error);
    throw new Error(error.message);
  }
};

exports.followUser = async (followerId, followedId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string IDs to UUIDs if needed
    let followerIdUUID, followedIdUUID;
    try {
      followerIdUUID = new UUID(followerId);
      followedIdUUID = new UUID(followedId);
    } catch (uuidError) {
      followerIdUUID = followerId;
      followedIdUUID = followedId;
    }
    
    // Check if already following
    const existingFollow = await followsCollection.findOne({
      follower_id: followerIdUUID,
      following_id: followedIdUUID
    });
    
    if (existingFollow) {
      throw new Error('Already following this user');
    }
    
    // Generate new UUID for the follow
    const followId = new UUID();
    
    const newFollow = {
      _id: followId,
      follower_id: followerIdUUID,
      following_id: followedIdUUID,
      created_at: new Date().toISOString()
    };
    
    const result = await followsCollection.insertOne(newFollow);
    const createdFollow = { ...newFollow, _id: result.insertedId };
    
    // Transform for client (convert UUIDs to strings)
    return {
      ...createdFollow,
      id: createdFollow._id.toString(),
      follower_id: createdFollow.follower_id.toString(),
      following_id: createdFollow.following_id.toString()
    };
  } catch (error) {
    console.error('Error in followUser:', error);
    throw new Error(error.message);
  }
};

exports.unfollowUser = async (followerId, followedId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string IDs to UUIDs if needed
    let followerIdUUID, followedIdUUID;
    try {
      followerIdUUID = new UUID(followerId);
      followedIdUUID = new UUID(followedId);
    } catch (uuidError) {
      followerIdUUID = followerId;
      followedIdUUID = followedId;
    }
    
    const result = await followsCollection.deleteOne({
      follower_id: followerIdUUID,
      following_id: followedIdUUID
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Follow relationship not found');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    throw new Error(error.message);
  }
};

exports.getFollowing = async (userId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const follows = await followsCollection.find({
      follower_id: userIdUUID
    }).toArray();
    
    // Get profiles for all following users
    const followingProfiles = await Promise.all(
      follows.map(async (follow) => {
        try {
          const profile = await profilesCollection.findOne({ _id: follow.following_id });
          return profile ? {
            ...profile,
            id: profile._id.toString(),
            follow_id: follow._id.toString()
          } : null;
        } catch (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
      })
    );
    
    return followingProfiles.filter(profile => profile !== null);
  } catch (error) {
    console.error('Error in getFollowing:', error);
    throw new Error(error.message);
  }
};

exports.getFollowers = async (userId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const follows = await followsCollection.find({
      following_id: userIdUUID
    }).toArray();
    
    // Get profiles for all followers
    const followerProfiles = await Promise.all(
      follows.map(async (follow) => {
        try {
          const profile = await profilesCollection.findOne({ _id: follow.follower_id });
          return profile ? {
            ...profile,
            id: profile._id.toString(),
            follow_id: follow._id.toString()
          } : null;
        } catch (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
      })
    );
    
    return followerProfiles.filter(profile => profile !== null);
  } catch (error) {
    console.error('Error in getFollowers:', error);
    throw new Error(error.message);
  }
};

exports.getFollowingCount = async (userId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const count = await followsCollection.countDocuments({
      follower_id: userIdUUID
    });
    
    return count || 0;
  } catch (error) {
    console.error('Error in getFollowingCount:', error);
    throw new Error(error.message);
  }
};

exports.getFollowersCount = async (userId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const count = await followsCollection.countDocuments({
      following_id: userIdUUID
    });
    
    return count || 0;
  } catch (error) {
    console.error('Error in getFollowersCount:', error);
    throw new Error(error.message);
  }
};

exports.isFollowing = async (followerId, followedId) => {
  try {
    const db = await getDatabase();
    const followsCollection = db.collection('follows');
    
    // Convert string IDs to UUIDs if needed
    let followerIdUUID, followedIdUUID;
    try {
      followerIdUUID = new UUID(followerId);
      followedIdUUID = new UUID(followedId);
    } catch (uuidError) {
      followerIdUUID = followerId;
      followedIdUUID = followedId;
    }
    
    const follow = await followsCollection.findOne({
      follower_id: followerIdUUID,
      following_id: followedIdUUID
    });
    
    return !!follow;
  } catch (error) {
    console.error('Error in isFollowing:', error);
    throw new Error(error.message);
  }
}; 