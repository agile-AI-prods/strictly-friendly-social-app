const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Get all users with pagination and search
exports.getAllUsers = async (page = 1, limit = 20, search = '', currentUserId = null) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const connectionsCollection = db.collection('connections');
    const followsCollection = db.collection('follows');
    const friendsCollection = db.collection('friends');
    const activitiesCollection = db.collection('activities');
    
    // Convert string ID to UUID if needed
    let currentUserIdUUID = null;
    if (currentUserId) {
      try {
        currentUserIdUUID = new UUID(currentUserId);
      } catch (uuidError) {
        currentUserIdUUID = currentUserId;
      }
    }
    
    // Build search query
    let searchQuery = {};
    if (search && search.trim()) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Exclude current user from results
    if (currentUserIdUUID) {
      searchQuery._id = { $ne: currentUserIdUUID };
    }
    
    // Get total count for pagination
    const totalUsers = await profilesCollection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await profilesCollection.find(searchQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Transform users and add additional data
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get connection status
          let connectionStatus = null;
          if (currentUserIdUUID) {
            const connection = await connectionsCollection.findOne({
              $or: [
                { sender_id: currentUserIdUUID, receiver_id: user._id },
                { sender_id: user._id, receiver_id: currentUserIdUUID }
              ]
            });
            connectionStatus = connection ? connection.status : null;
          }
          
          // Get follow status
          let isFollowing = false;
          if (currentUserIdUUID) {
            const follow = await followsCollection.findOne({
              follower_id: currentUserIdUUID,
              following_id: user._id
            });
            isFollowing = !!follow;
          }
          
          // Get friend status
          let isFriend = false;
          if (currentUserIdUUID) {
            const friend = await friendsCollection.findOne({
              $or: [
                { user_id: currentUserIdUUID, friend_id: user._id },
                { user_id: user._id, friend_id: currentUserIdUUID }
              ]
            });
            isFriend = !!friend;
          }
          
          // Get friends count
          const friendsCount = await friendsCollection.countDocuments({
            user_id: user._id
          });
          
          // Get connection count
          const connectionCount = await connectionsCollection.countDocuments({
            $or: [
              { sender_id: user._id, status: 'accepted' },
              { receiver_id: user._id, status: 'accepted' }
            ]
          });
          
          // Get activity count
          const activityCount = await activitiesCollection.countDocuments({
            creator_id: user._id
          });
          
          return {
            ...user,
            id: user._id.toString(),
            connectionStatus,
            isFollowing,
            isFriend,
            friendsCount,
            connectionCount,
            activityCount
          };
        } catch (error) {
          console.error('Error enriching user data:', error);
          return {
            ...user,
            id: user._id.toString(),
            connectionStatus: null,
            isFollowing: false,
            isFriend: false,
            friendsCount: 0,
            connectionCount: 0,
            activityCount: 0
          };
        }
      })
    );
    
    return {
      users: enrichedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw new Error(error.message);
  }
};

// Get user suggestions based on interests, age, and location
exports.getUserSuggestions = async (userId, limit = 10) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const connectionsCollection = db.collection('connections');
    const followsCollection = db.collection('follows');
    const friendsCollection = db.collection('friends');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get current user's profile
    const currentUser = await profilesCollection.findOne({ _id: userIdUUID });
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    // Get users the current user is already connected to
    const existingConnections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID },
        { receiver_id: userIdUUID }
      ]
    }).toArray();
    
    const connectedUserIds = existingConnections.map(conn => 
      conn.sender_id.toString() === userIdUUID.toString() 
        ? conn.receiver_id 
        : conn.sender_id
    );
    
    // Get users the current user is already following
    const existingFollows = await followsCollection.find({
      follower_id: userIdUUID
    }).toArray();
    
    const followingUserIds = existingFollows.map(follow => follow.following_id);
    
    // Get users the current user is already friends with
    const existingFriends = await friendsCollection.find({
      user_id: userIdUUID
    }).toArray();
    
    const friendUserIds = existingFriends.map(friend => friend.friend_id);
    
    // Combine all excluded user IDs
    const excludedUserIds = [
      userIdUUID,
      ...connectedUserIds,
      ...followingUserIds,
      ...friendUserIds
    ];
    
    // Get all potential suggestions (excluding current user and existing connections)
    const potentialUsers = await profilesCollection.find({
      _id: { $nin: excludedUserIds }
    }).toArray();
    
    // Calculate scores for each user
    const usersWithScores = await Promise.all(
      potentialUsers.map(async (user) => {
        try {
          // Calculate interest score (40%)
          let interestScore = 0;
          if (currentUser.interests && user.interests && 
              Array.isArray(currentUser.interests) && Array.isArray(user.interests)) {
            const commonInterests = currentUser.interests.filter(interest => 
              user.interests.includes(interest)
            );
            interestScore = (commonInterests.length / currentUser.interests.length) * 0.4;
          }
          
          // Calculate age score (30%)
          let ageScore = 0;
          if (currentUser.birthday && user.birthday) {
            const currentAge = calculateAge(currentUser.birthday);
            const userAge = calculateAge(user.birthday);
            const ageDifference = Math.abs(currentAge - userAge);
            
            if (ageDifference <= 5) ageScore = 1.0 * 0.3;
            else if (ageDifference <= 10) ageScore = 0.8 * 0.3;
            else if (ageDifference <= 15) ageScore = 0.6 * 0.3;
            else if (ageDifference <= 20) ageScore = 0.4 * 0.3;
            else ageScore = 0.2 * 0.3;
          }
          
          // Calculate location score (30%)
          let locationScore = 0;
          if (currentUser.location && user.location && 
              currentUser.location.coordinates && user.location.coordinates) {
            const distance = calculateDistance(
              currentUser.location.coordinates,
              user.location.coordinates
            );
            
            if (distance <= 5) locationScore = 1.0 * 0.3;
            else if (distance <= 10) locationScore = 0.9 * 0.3;
            else if (distance <= 25) locationScore = 0.7 * 0.3;
            else if (distance <= 50) locationScore = 0.5 * 0.3;
            else if (distance <= 100) locationScore = 0.3 * 0.3;
            else locationScore = 0.1 * 0.3;
          }
          
          // Calculate total score
          const totalScore = interestScore + ageScore + locationScore;
          
          // Generate recommendation reason
          const reasons = [];
          if (interestScore > 0) {
            const commonInterests = currentUser.interests?.filter(interest => 
              user.interests?.includes(interest)
            ) || [];
            if (commonInterests.length > 0) {
              reasons.push(`공통 관심사: ${commonInterests.join(', ')}`);
            }
          }
          if (ageScore > 0) {
            const currentAge = calculateAge(currentUser.birthday);
            const userAge = calculateAge(user.birthday);
            reasons.push(`나이대: ${userAge}세 (${currentAge}세와 ${Math.abs(currentAge - userAge)}세 차이)`);
          }
          if (locationScore > 0) {
            const distance = calculateDistance(
              currentUser.location?.coordinates,
              user.location?.coordinates
            );
            reasons.push(`거리: ${distance.toFixed(1)}km`);
          }
          
          return {
            ...user,
            id: user._id.toString(),
            suggestionScore: totalScore,
            recommendationReasons: reasons,
            interestScore: interestScore,
            ageScore: ageScore,
            locationScore: locationScore
          };
        } catch (error) {
          console.error(`Error calculating score for user ${user._id}:`, error);
          return {
            ...user,
            id: user._id.toString(),
            suggestionScore: 0,
            recommendationReasons: ['점수 계산 중 오류 발생'],
            interestScore: 0,
            ageScore: 0,
            locationScore: 0
          };
        }
      })
    );
    
    // Sort by suggestion score and return top users
    const sortedSuggestions = usersWithScores
      .sort((a, b) => b.suggestionScore - a.suggestionScore)
      .slice(0, limit);
    
    return sortedSuggestions;
  } catch (error) {
    console.error('Error in getUserSuggestions:', error);
    throw new Error(error.message);
  }
};

// Helper function to calculate age from birthday
function calculateAge(birthday) {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1[0] || !coord1[1] || !coord2[0] || !coord2[1]) {
    return 999; // Return large distance if coordinates are invalid
  }
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get user statistics
exports.getUserStats = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    const followsCollection = db.collection('follows');
    const friendsCollection = db.collection('friends');
    const activitiesCollection = db.collection('activities');
    const messagesCollection = db.collection('messages');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    // Get various counts
    const [friendsCount, connectionCount, activityCount, messageCount] = await Promise.all([
      friendsCollection.countDocuments({ user_id: userIdUUID }),
      connectionsCollection.countDocuments({
        $or: [
          { sender_id: userIdUUID, status: 'accepted' },
          { receiver_id: userIdUUID, status: 'accepted' }
        ]
      }),
      activitiesCollection.countDocuments({ creator_id: userIdUUID }),
      messagesCollection.countDocuments({
        $or: [
          { sender_id: userIdUUID },
          { receiver_id: userIdUUID }
        ]
      })
    ]);
    
    return {
      friendsCount: friendsCount || 0,
      connectionCount: connectionCount || 0,
      activityCount: activityCount || 0,
      messageCount: messageCount || 0
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw new Error(error.message);
  }
};

// Search users by various criteria
exports.searchUsers = async (searchTerm, filters = {}, page = 1, limit = 20, currentUserId = null) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const connectionsCollection = db.collection('connections');
    const followsCollection = db.collection('follows');
    const friendsCollection = db.collection('friends');
    
    // Convert string ID to UUID if needed
    let currentUserIdUUID = null;
    if (currentUserId) {
      try {
        currentUserIdUUID = new UUID(currentUserId);
      } catch (uuidError) {
        currentUserIdUUID = currentUserId;
      }
    }
    
    // Build search query
    let searchQuery = {};
    
    if (searchTerm && searchTerm.trim()) {
      searchQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { bio: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Add filters
    if (filters.ageMin || filters.ageMax) {
      searchQuery.age = {};
      if (filters.ageMin) searchQuery.age.$gte = parseInt(filters.ageMin);
      if (filters.ageMax) searchQuery.age.$lte = parseInt(filters.ageMax);
    }
    
    // Add interests filter
    if (filters.interests && filters.interests.length > 0) {
      searchQuery.interests = { $in: filters.interests };
    }
    
    // Exclude current user from results
    if (currentUserIdUUID) {
      searchQuery._id = { $ne: currentUserIdUUID };
    }
    
    // Get total count for pagination
    const totalUsers = await profilesCollection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await profilesCollection.find(searchQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Transform users and add additional data
    const transformedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get connection status
          let connectionStatus = null;
          if (currentUserIdUUID) {
            const connection = await connectionsCollection.findOne({
              $or: [
                { sender_id: currentUserIdUUID, receiver_id: user._id },
                { sender_id: user._id, receiver_id: currentUserIdUUID }
              ]
            });
            connectionStatus = connection ? connection.status : null;
          }
          
          // Get follow status
          let isFollowing = false;
          if (currentUserIdUUID) {
            const follow = await followsCollection.findOne({
              follower_id: currentUserIdUUID,
              following_id: user._id
            });
            isFollowing = !!follow;
          }
          
          // Get friend status
          let isFriend = false;
          if (currentUserIdUUID) {
            const friend = await friendsCollection.findOne({
              $or: [
                { user_id: currentUserIdUUID, friend_id: user._id },
                { user_id: user._id, friend_id: currentUserIdUUID }
              ]
            });
            isFriend = !!friend;
          }
          
          // Get friends count
          const friendsCount = await friendsCollection.countDocuments({
            user_id: user._id
          });
          
          return {
            ...user,
            id: user._id.toString(),
            connectionStatus,
            isFollowing,
            isFriend,
            friends_count: friendsCount
          };
        } catch (error) {
          console.error(`Error processing user ${user._id}:`, error);
          return {
            ...user,
            id: user._id.toString(),
            connectionStatus: null,
            isFollowing: false,
            isFriend: false,
            friends_count: 0
          };
        }
      })
    );
    
    return {
      profiles: transformedUsers,
      page: page,
      hasMore: page < totalPages,
      total: totalUsers
    };
  } catch (error) {
    console.error('Error in searchUsers:', error);
    throw new Error(error.message);
  }
};

// Get filtered users (legacy function for backward compatibility)
exports.getFilteredUsers = async (filters) => {
  try {
    console.log('🔍 getFilteredUsers called with filters:', JSON.stringify(filters, null, 2));
    
    const {
      currentUserId,
      searchTerm,
      interests,
      maxDistance,
      currentUserLocation,
      page = 1,
      limit = 20,
      sortBy = 'distance'
    } = filters;

    console.log('📋 Parsed filters:', {
      currentUserId,
      searchTerm,
      interests,
      maxDistance,
      currentUserLocation,
      page,
      limit,
      sortBy
    });

    // Get current user's email from auth_users collection
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    
    let currentUserEmail = null;
    if (currentUserId) {
      try {
        let currentUserIdUUID;
        try {
          currentUserIdUUID = new UUID(currentUserId);
          console.log('✅ UUID created successfully:', currentUserIdUUID);
        } catch (uuidError) {
          console.log('⚠️ UUID creation failed, using original ID:', currentUserId);
          currentUserIdUUID = currentUserId;
        }
        
        console.log('🔍 Searching auth_users for ID:', currentUserIdUUID);
        const currentUser = await authUsersCollection.findOne({ _id: currentUserIdUUID });
        console.log('🔍 Auth user search result:', currentUser ? 'Found' : 'Not found');
        
        if (currentUser && currentUser.email) {
          currentUserEmail = currentUser.email;
          console.log('✅ Current user email found:', currentUserEmail);
        } else {
          console.log('❌ Current user email not found in auth_users');
        }
      } catch (error) {
        console.error('❌ Error getting current user email:', error);
      }
    } else {
      console.log('⚠️ No currentUserId provided');
    }

    // Get all profiles excluding current user
    const profilesCollection = db.collection('profiles');
    const connectionsCollection = db.collection('connections');
    const followsCollection = db.collection('follows');
    const friendsCollection = db.collection('friends');
    
    console.log('📚 Collections initialized');
    
    // Build search query
    let searchQuery = {};
    
    if (searchTerm && searchTerm.trim()) {
      searchQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { bio: { $regex: searchTerm, $options: 'i' } }
      ];
      console.log('🔍 Search query added:', searchTerm);
    }
    
    // Add filters
    if (filters.ageMin || filters.ageMax) {
      searchQuery.age = {};
      if (filters.ageMin) searchQuery.age.$gte = parseInt(filters.ageMin);
      if (filters.ageMax) searchQuery.age.$lte = parseInt(filters.ageMax);
      console.log('📅 Age filter added:', { min: filters.ageMin, max: filters.ageMax });
    }
    
    // Add interests filter
    if (interests && interests.length > 0) {
      searchQuery.interests = { $in: interests };
      console.log('🎯 Interests filter added:', interests);
    }
    
    // Exclude current user from results
    if (currentUserEmail) {
      searchQuery.email = { $ne: currentUserEmail };
      console.log('🚫 Excluding current user email:', currentUserEmail);
    }
    
    console.log('🔍 Final search query:', JSON.stringify(searchQuery, null, 2));
    
    // Get total count for pagination
    const totalUsers = await profilesCollection.countDocuments(searchQuery);
    console.log('📊 Total users found:', totalUsers);
    
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;
    console.log('📄 Pagination:', { page, limit, skip, totalPages });
    
    // Get users with pagination
    const users = await profilesCollection.find(searchQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    console.log('👥 Users retrieved:', users.length);
    
    // Transform users and add additional data
    const transformedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get connection status
          let connectionStatus = null;
          if (currentUserId) {
            const connection = await connectionsCollection.findOne({
              $or: [
                { sender_id: currentUserId, receiver_id: user._id },
                { sender_id: user._id, receiver_id: currentUserId }
              ]
            });
            connectionStatus = connection ? connection.status : null;
          }
          
          // Get follow status
          let isFollowing = false;
          if (currentUserId) {
            const follow = await followsCollection.findOne({
              follower_id: currentUserId,
              following_id: user._id
            });
            isFollowing = !!follow;
          }
          
          // Get friend status
          let isFriend = false;
          if (currentUserId) {
            const friend = await friendsCollection.findOne({
              $or: [
                { user_id: currentUserId, friend_id: user._id },
                { user_id: user._id, friend_id: currentUserId }
              ]
            });
            isFriend = !!friend;
          }
          
          // Get friends count
          const friendsCount = await friendsCollection.countDocuments({
            user_id: user._id
          });

        return {
          ...user,
            id: user._id.toString(),
            connectionStatus,
            isFollowing,
            isFriend,
            friends_count: friendsCount
          };
        } catch (error) {
          console.error(`Error processing user ${user._id}:`, error);
          return {
            ...user,
            id: user._id.toString(),
            connectionStatus: null,
            isFollowing: false,
            isFriend: false,
            friends_count: 0
          };
        }
      })
    );
    
    console.log('🔍 Transformed users validation:', {
      hasTransformedUsers: !!transformedUsers,
      transformedUsersIsArray: Array.isArray(transformedUsers),
      transformedUsersLength: transformedUsers?.length || 'N/A',
      firstUser: transformedUsers?.[0] ? 'Has first user' : 'No first user',
      firstUserId: transformedUsers?.[0]?.id || 'N/A'
    });
    
    console.log('✅ Final result:', {
      usersCount: transformedUsers.length,
      page: page,
      hasMore: page < totalPages,
      total: totalUsers
    });
    
    // Validate the return object before returning
    const returnObject = {
      profiles: transformedUsers,
      page: page,
      hasMore: page < totalPages,
      total: totalUsers
    };
    
    console.log('🔍 Return object validation:', {
      hasProfiles: !!returnObject.profiles,
      profilesIsArray: Array.isArray(returnObject.profiles),
      profilesLength: returnObject.profiles?.length || 'N/A',
      returnObjectKeys: Object.keys(returnObject),
      returnObject: JSON.stringify(returnObject, null, 2)
    });
    
    return returnObject;
  } catch (error) {
    console.error('❌ Error in getFilteredUsers:', error);
    throw new Error(error.message);
  }
};

// Get friends counts for multiple users
exports.getFriendsCounts = async (userIds) => {
  try {
    const db = await getDatabase();
    const friendsCollection = db.collection('friends');
    
    const counts = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          // Convert string ID to UUID if needed
          let userIdUUID;
          try {
            userIdUUID = new UUID(userId);
          } catch (uuidError) {
            userIdUUID = userId;
          }
          
          const count = await friendsCollection.countDocuments({ user_id: userIdUUID });
        counts[userId] = count || 0;
        } catch (error) {
          console.error(`Error getting friends count for user ${userId}:`, error);
          counts[userId] = 0;
        }
      })
    );

    return counts;
  } catch (error) {
    console.error('Error in getFriendsCounts:', error);
    throw new Error(error.message);
  }
};

// Get suggested users based on interests and location
exports.getSuggestedUsers = async (userId, limit = 10) => {
  try {
    return await this.getUserSuggestions(userId, limit);
  } catch (error) {
    console.error('Error in getSuggestedUsers:', error);
    throw new Error(error.message);
  }
};

// Get popular users based on friends count and activities
exports.getPopularUsers = async (limit = 10) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    const friendsCollection = db.collection('friends');
    const activitiesCollection = db.collection('activities');
    
    // Get all users with their popularity scores
    const allUsers = await profilesCollection.find({}).toArray();

    // Calculate popularity score for each user
    const usersWithPopularity = await Promise.all(
      allUsers.map(async (user) => {
        try {
          // Convert string ID to UUID if needed
          let userIdUUID;
          try {
            userIdUUID = new UUID(user._id);
          } catch (uuidError) {
            userIdUUID = user._id;
          }
          
          // Get friends count (connections with 'accepted' status)
          const friendsCount = await friendsCollection.countDocuments({
            user_id: userIdUUID
          });
          
          // Get activity count
          const activityCount = await activitiesCollection.countDocuments({
            creator_id: userIdUUID
          });

          // Calculate popularity score: (친구 수 × 2) + 활동 수
          const popularityScore = (friendsCount || 0) * 2 + (activityCount || 0);

        return {
          ...user,
            id: user._id.toString(),
          popularityScore,
            friendsCount: friendsCount || 0,
          activityCount: activityCount || 0
        };
        } catch (error) {
          console.error(`Error calculating popularity for user ${user._id}:`, error);
          return {
            ...user,
            id: user._id.toString(),
            popularityScore: 0,
            friendsCount: 0,
            activityCount: 0
          };
        }
      })
    );

    // Sort by popularity and return top users
    const popularUsers = usersWithPopularity
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);

    return popularUsers;
  } catch (error) {
    console.error('Error in getPopularUsers:', error);
    throw new Error(error.message);
  }
}; 