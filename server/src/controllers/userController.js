const userService = require('../services/userService');
const auth = require('../middleware/auth');

exports.getFilteredUsers = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.sub;
    if (!userId) {
      console.error('No userId found in req.user:', req.user);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const {
      searchTerm,
      interests,
      maxDistance,
      page = 1,
      limit = 20,
      sortBy = 'distance'
    } = req.query;
    
    // Get current user's location from the request or user profile
    const currentUserLocation = req.body.currentUserLocation;

    const filters = {
      currentUserId: userId,
      searchTerm,
      interests: interests ? interests.split(',') : undefined,
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
      currentUserLocation,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    };

    const result = await userService.getFilteredUsers(filters);
    
    // Log the result for debugging
    console.log('🔍 userController.getFilteredUsers result:', {
      hasResult: !!result,
      resultType: typeof result,
      profilesCount: result?.profiles?.length || 'N/A',
      resultKeys: result ? Object.keys(result) : 'N/A',
      fullResult: JSON.stringify(result, null, 2)
    });
    
    // Add cache prevention headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error in getFilteredUsers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch filtered users',
      message: error.message 
    });
  }
};

exports.getFriendsCounts = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const counts = await userService.getFriendsCounts(userIds);
    
    res.json(counts);
  } catch (error) {
    console.error('Error in getFriendsCounts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch friends counts',
      message: error.message 
    });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.sub;
    if (!userId) {
      console.error('No userId found in req.user:', req.user);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { limit = 10 } = req.query;

    console.log('Getting suggested users for userId:', userId);
    const suggestedUsers = await userService.getSuggestedUsers(userId, parseInt(limit));
    
    res.json(suggestedUsers);
  } catch (error) {
    console.error('Error in getSuggestedUsers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suggested users',
      message: error.message 
    });
  }
};

exports.getPopularUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularUsers = await userService.getPopularUsers(parseInt(limit));
    
    res.json(popularUsers);
  } catch (error) {
    console.error('Error in getPopularUsers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch popular users',
      message: error.message 
    });
  }
}; 