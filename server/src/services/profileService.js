const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Socket.io instance (will be set from outside)
let io = null;

// Function to set Socket.io instance
const setSocketIO = (socketIO) => {
  io = socketIO;
  console.log('Socket.io instance set in profileService:', !!io);
};

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Save file to local storage and return URL
const saveFileLocally = (file, filename) => {
  try {
    const uploadsDir = ensureUploadsDir();
    const filePath = path.join(uploadsDir, filename);
    
    // Save file
    fs.writeFileSync(filePath, file.buffer);
    
    // Return URL for frontend
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw new Error('Failed to save file');
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// MongoDB: Get profile by ID
exports.getProfile = async (id) => {
  try {
    console.log('getProfile called with id:', id, 'type:', typeof id);
    
    if (!id) {
      throw new Error('Profile ID is required');
    }

    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    let profile = null;
    
    // Try to find by _id directly (for UUID objects)
    profile = await profilesCollection.findOne({ _id: id });
    console.log('Profile found by direct _id:', !!profile);
    
    // If not found and id is a string, try to create UUID from string
    if (!profile && typeof id === 'string') {
      try {
        const uuidFromString = new UUID(id);
        profile = await profilesCollection.findOne({ _id: uuidFromString });
        console.log('Profile found by UUID conversion:', !!profile);
      } catch (uuidError) {
        console.log('UUID conversion failed:', uuidError.message);
        // Invalid UUID string, continue to next search method
      }
    }
    
    // If still not found, try to find by email (fallback)
    if (!profile) {
      console.log('Trying to find profile by email as fallback');
      profile = await profilesCollection.findOne({ email: id });
      console.log('Profile found by email fallback:', !!profile);
    }

    if (!profile) {
      console.error('Profile not found by _id, email, or UUID comparison:', id);
      // Log available profiles for debugging
      const allProfiles = await profilesCollection.find({}).limit(5).toArray();
      console.log('Available profiles (first 5):', allProfiles.map(p => ({ 
        _id: p._id, 
        _idType: typeof p._id,
        _idString: p._id && typeof p._id === 'object' && p._id.toString ? p._id.toString() : p._id,
        name: p.name, 
        email: p.email 
      })));
      throw new Error('Profile not found');
    }
    
    // Ensure the profile has an id field that matches the search parameter
    if (profile._id && !profile.id) {
      profile.id = profile._id.toString();
    }
    
    console.log('Returning profile with id:', profile.id || profile._id);
    return profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    throw error;
  }
};

// MongoDB: Upload profile photo
exports.uploadProfilePhoto = async (profileId, file) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let uuidId = profileId;
    if (typeof profileId === 'string') {
      try {
        uuidId = new UUID(profileId);
      } catch (uuidError) {
        throw new Error('Invalid profile ID format');
      }
    }
    
    // Get current profile
    const existingProfile = await profilesCollection.findOne({ _id: uuidId });
    if (!existingProfile) {
      throw new Error('Profile not found');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `profile_${profileId}_${timestamp}_${randomString}${extension}`;
    
    // Save file locally and get URL
    const fileUrl = saveFileLocally(file, filename);
    
    console.log('💾 File saved locally:', filename);
    console.log('🔗 File URL:', fileUrl);
    
    // Store URL string in photo_url field (like before)
    const result = await profilesCollection.updateOne(
      { _id: uuidId },
      { 
        $set: { 
          photo_url: fileUrl,  // Store URL string directly
          updated_at: new Date()
        }
      }
    );
    
    if (!result.acknowledged) {
      throw new Error('Failed to update profile photo');
    }
    
         console.log('✅ Profile photo updated successfully');
     console.log('🔗 URL stored in photo_url:', fileUrl);
     
     // Return only the URL string, not an object
     return fileUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

// MongoDB: Upload cover image
exports.uploadCoverImage = async (profileId, file) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let uuidId = profileId;
    if (typeof profileId === 'string') {
      try {
        uuidId = new UUID(profileId);
      } catch (uuidError) {
        throw new Error('Invalid profile ID format');
      }
    }
    
    // Get current profile
    const existingProfile = await profilesCollection.findOne({ _id: uuidId });
    if (!existingProfile) {
      throw new Error('Profile not found');
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `cover_${profileId}_${timestamp}_${randomString}${extension}`;
    
    // Save file locally and get URL
    const fileUrl = saveFileLocally(file, filename);
    
    console.log('💾 Cover file saved locally:', filename);
    console.log('🔗 Cover file URL:', fileUrl);
    
    // Store URL string in cover_url field (like before)
    const result = await profilesCollection.updateOne(
      { _id: uuidId },
      { 
        $set: { 
          cover_url: fileUrl,  // Store URL string directly
          updated_at: new Date()
        }
      }
    );
    
    if (!result.acknowledged) {
      throw new Error('Failed to update cover image');
    }
    
         console.log('✅ Cover image updated successfully');
     console.log('🔗 URL stored in cover_url:', fileUrl);
     
     // Return only the URL string, not an object
     return fileUrl;
  } catch (error) {
    console.error('Error uploading cover image:', error);
    throw error;
  }
};

// MongoDB: Create new profile
exports.createProfile = async (userId, profileData) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Generate new UUID for the profile
    const profileId = new UUID();
    
    const newProfile = {
      _id: profileId,
      user_id: userId, // Store the original userId separately
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      friends_count: 0
    };
    
    const result = await profilesCollection.insertOne(newProfile);
    return { ...newProfile, _id: result.insertedId };
  } catch (error) {
    console.error('Error in createProfile:', error);
    throw error;
  }
};

// MongoDB: Update profile
exports.updateProfile = async (id, updates) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Convert string ID to UUID if needed
    let uuidId = id;
    if (typeof id === 'string') {
      try {
        uuidId = new UUID(id);
      } catch (uuidError) {
        throw new Error('Invalid profile ID format');
      }
    }
    
    console.log('🔍 Updating profile with ID:', id, 'UUID:', uuidId);
    console.log('📝 Updates:', updates);
    
    // Process updates (no special handling needed since we use same fields)
    const processedUpdates = { ...updates };
    
    console.log('📝 Processing updates for photo_url and cover_url fields');
    
    const result = await profilesCollection.updateOne(
      { _id: uuidId },
      {
        $set: {
          ...processedUpdates,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    console.log('🔍 Update result:', result);
    
    if (result.matchedCount === 0) {
      throw new Error('Profile not found');
    }
    
    // Get updated profile
    const updatedProfile = await profilesCollection.findOne({ _id: uuidId });
    
    // Notify friends about profile update
    try {
      await notifyFriendsAboutProfileUpdate(updatedProfile);
    } catch (notificationError) {
      console.error('Error notifying friends about profile update:', notificationError);
      // Don't throw error to avoid breaking profile update
    }
    
    console.log('✅ Profile updated successfully');
    return updatedProfile;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};

// MongoDB: Get all profiles
exports.getAllProfiles = async () => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    return await profilesCollection.find({}).toArray();
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    throw error;
  }
};

// MongoDB: Get profile by email
exports.getProfileByEmail = async (email) => {
  try {
    console.log(`Searching for profile with email: ${email}`);
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const profile = await profilesCollection.findOne({ email });
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    console.log('Profile found by email:', profile);
    return profile;
  } catch (error) {
    console.error('Profile by email error:', error);
    throw error;
  }
};

// MongoDB: Get filtered profiles
exports.getFilteredProfiles = async (currentUserId, filters) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Build MongoDB query
    let query = { _id: { $ne: currentUserId } };
    
    // Apply filters
    if (filters.searchTerm) {
      query.$or = [
        { name: { $regex: filters.searchTerm, $options: 'i' } },
        { bio: { $regex: filters.searchTerm, $options: 'i' } }
      ];
    }
    
    if (filters.ageRange) {
      query.age = {
        $gte: filters.ageRange.min,
        $lte: filters.ageRange.max
      };
    }
    
    if (filters.interests && filters.interests.length > 0) {
      query.interests = {
        $elemMatch: {
          $or: filters.interests.map(interest => ({
            $or: [
              { id: { $regex: interest, $options: 'i' } },
              { label: { $regex: interest, $options: 'i' } }
            ]
          }))
        }
      };
    }
    
    if (filters.location && filters.maxDistance) {
      // Location filtering will be done in memory after fetching
      query.location = { $exists: true, $ne: null };
    }
    
    // Execute query
    let profiles = await profilesCollection.find(query).toArray();
    
    // Apply location filtering if needed
    if (filters.location && filters.maxDistance) {
      profiles = profiles.filter(profile => {
        if (!profile.location || !profile.location.latitude || !profile.location.longitude) {
          return false;
        }
        
        const distance = calculateDistance(
          filters.location.latitude,
          filters.location.longitude,
          profile.location.latitude,
          profile.location.longitude
        );
        
        return distance <= filters.maxDistance;
      });
    }
    
    // Sort profiles
    if (filters.sortBy === 'distance' && filters.location) {
      profiles.sort((a, b) => {
        if (!a.location || !b.location) return 0;
        
        const distanceA = calculateDistance(
          filters.location.latitude,
          filters.location.longitude,
          a.location.latitude,
          a.location.longitude
        );
        
        const distanceB = calculateDistance(
          filters.location.latitude,
          filters.location.longitude,
          b.location.latitude,
          b.location.longitude
        );
        
        return distanceA - distanceB;
      });
    } else if (filters.sortBy === 'name') {
      profiles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'age') {
      profiles.sort((a, b) => (a.age || 0) - (b.age || 0));
    }
    
    // Apply pagination
    if (filters.page && filters.limit) {
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      profiles = profiles.slice(startIndex, endIndex);
    }
    
    return profiles;
  } catch (error) {
    console.error('Error in getFilteredProfiles:', error);
    throw error;
  }
};

// MongoDB: Get profiles by IDs
exports.getProfilesByIds = async (profileIds) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const profiles = await profilesCollection.find({
      _id: { $in: profileIds }
    }).toArray();
    
    return profiles;
  } catch (error) {
    console.error('Error in getProfilesByIds:', error);
    throw error;
  }
};

// MongoDB: Update profile photo
exports.updateProfilePhoto = async (userId, photoUrl) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const result = await profilesCollection.updateOne(
      { _id: userId },
      {
        $set: {
          photo_url: photoUrl,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Profile not found');
    }
    
    return await profilesCollection.findOne({ _id: userId });
  } catch (error) {
    console.error('Error in updateProfilePhoto:', error);
    throw error;
  }
};

// MongoDB: Update profile location
exports.updateProfileLocation = async (userId, location) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const result = await profilesCollection.updateOne(
      { _id: userId },
      {
        $set: {
          location,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Profile not found');
    }
    
    return await profilesCollection.findOne({ _id: userId });
  } catch (error) {
    console.error('Error in updateProfileLocation:', error);
    throw error;
  }
};

// MongoDB: Update profile interests
exports.updateProfileInterests = async (userId, interests) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const result = await profilesCollection.updateOne(
      { _id: userId },
      {
        $set: {
          interests,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Profile not found');
    }
    
    return await profilesCollection.findOne({ _id: userId });
  } catch (error) {
    console.error('Error in updateProfileInterests:', error);
    throw error;
  }
};

// MongoDB: Delete profile
exports.deleteProfile = async (userId) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const result = await profilesCollection.deleteOne({ _id: userId });
    
    if (result.deletedCount === 0) {
      throw new Error('Profile not found');
    }
    
    return { success: true, message: 'Profile deleted successfully' };
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    throw error;
  }
};

// MongoDB: Search profiles by text
exports.searchProfiles = async (searchTerm, limit = 20) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const profiles = await profilesCollection.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { bio: { $regex: searchTerm, $options: 'i' } },
        { 'interests.label': { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(limit).toArray();
    
    return profiles;
  } catch (error) {
    console.error('Error in searchProfiles:', error);
    throw error;
  }
};

// MongoDB: Get profiles by location
exports.getProfilesByLocation = async (latitude, longitude, maxDistance = 50, limit = 20) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    // Get all profiles with location data
    const profiles = await profilesCollection.find({
      location: { $exists: true, $ne: null }
    }).limit(limit * 2).toArray(); // Get more to filter by distance
    
    // Filter by distance
    const nearbyProfiles = profiles.filter(profile => {
      if (!profile.location || !profile.location.latitude || !profile.location.longitude) {
        return false;
      }
      
      const distance = calculateDistance(
        latitude,
        longitude,
        profile.location.latitude,
        profile.location.longitude
      );
      
      return distance <= maxDistance;
    });
    
    // Sort by distance and limit results
    nearbyProfiles.sort((a, b) => {
      const distanceA = calculateDistance(
        latitude,
        longitude,
        a.location.latitude,
        a.location.longitude
      );
      
      const distanceB = calculateDistance(
        latitude,
        longitude,
        b.location.latitude,
        b.location.longitude
      );
      
      return distanceA - distanceB;
    });
    
    return nearbyProfiles.slice(0, limit);
  } catch (error) {
    console.error('Error in getProfilesByLocation:', error);
    throw error;
  }
 };

// Helper function to notify friends about profile update
const notifyFriendsAboutProfileUpdate = async (profile) => {
  if (!io) {
    console.log('Socket.io not available for notifications');
    return;
  }
  
  try {
    // This would need to be implemented based on your notification system
    // For now, just log the update
    console.log(`Profile updated for user: ${profile._id}`);
    
    // You could emit a socket event here to notify friends
    // io.to(`user_${profile._id}`).emit('profile:updated', profile);
    
  } catch (error) {
    console.error('Error in notifyFriendsAboutProfileUpdate:', error);
  }
};

// Export setSocketIO function
exports.setSocketIO = setSocketIO; 