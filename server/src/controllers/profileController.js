const profileService = require('../services/profileService');

exports.getProfile = async (req, res) => {
    try {
        const profileId = req.params.id;
        
        if (!profileId || profileId === 'undefined') {
            return res.status(400).json({ error: 'Profile ID is required and cannot be undefined' });
        }
        
        const profile = await profileService.getProfile(profileId);
        res.json(profile);
    } catch (err) {
        console.error('Error in getProfile:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // First check if profile exists
        const existingProfile = await profileService.getProfile(userId);
        
        let result;
        if (!existingProfile) {
            // Profile doesn't exist, create it
            result = await profileService.createProfile(userId, req.body);
        } else {
            // Profile exists, update it
            result = await profileService.updateProfile(userId, req.body);
        }
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const profile = await profileService.createProfile(userId, req.body);
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await profileService.getAllProfiles();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFilteredProfiles = async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const filters = {
            searchTerm: req.query.searchTerm,
            interests: req.query.interests ? req.query.interests.split(',') : undefined,
            maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance) : undefined,
            currentUserLocation: req.body.currentUserLocation,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const profiles = await profileService.getFilteredProfiles(userId, filters);
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const photoUrl = await profileService.uploadProfilePhoto(req.params.id, req.file);
        res.json({ photoUrl });
    } catch (err) {
        console.error('Photo upload error:', err);

        // Handle specific error types
        if (err.message.includes('File too large')) {
            return res.status(413).json({ error: 'File size exceeds the 5MB limit. Please choose a smaller image.' });
        } else if (err.message.includes('Only image files are allowed')) {
            return res.status(400).json({ error: 'Only image files are allowed. Please select a valid image file.' });
        } else {
            res.status(500).json({ error: err.message || 'Failed to upload photo' });
        }
    }
};

exports.uploadCoverImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const coverUrl = await profileService.uploadCoverImage(req.params.id, req.file);
        res.json({ coverUrl });
    } catch (err) {
        console.error('Cover image upload error:', err);

        // Handle specific error types
        if (err.message.includes('File too large')) {
            return res.status(413).json({ error: 'File size exceeds the 5MB limit. Please choose a smaller image.' });
        } else if (err.message.includes('Only image files are allowed')) {
            return res.status(400).json({ error: 'Only image files are allowed. Please select a valid image file.' });
        } else {
            res.status(500).json({ error: err.message || 'Failed to upload cover image' });
        }
    }
};

exports.getMe = async (req, res) => {
    try {
        console.log('=== getMe Debug Info ===');
        console.log('req.user:', JSON.stringify(req.user, null, 2));
        console.log('req.user.id:', req.user.id);
        console.log('req.user.sub:', req.user.sub);
        console.log('req.user.email:', req.user.email);
        console.log('req.user.user_metadata:', req.user.user_metadata);
        console.log('========================');
        
        const userId = req.user.id || req.user.sub;
        console.log('getMe - userId:', userId);
        
        if (!userId) {
            console.log('No user ID found in token');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Try to get profile by ID first
        let profile;
        try {
            profile = await profileService.getProfile(userId);
            console.log('Profile found by ID:', profile ? 'Yes' : 'No');
        } catch (profileError) {
            console.log('Profile not found by ID, trying by email...');
            console.log('Profile error:', profileError.message);
            // If profile not found by ID, try to get by email
            if (req.user.email) {
                try {
                    profile = await profileService.getProfileByEmail(req.user.email);
                    console.log('Profile found by email:', profile ? 'Yes' : 'No');
                } catch (emailError) {
                    console.log('Profile not found by email either:', emailError.message);
                }
            }
        }
        
        if (!profile) {
            console.log('No profile found, returning user data');
            return res.json(req.user);
        }
        
        console.log('Returning profile data');
        res.json(profile);
    } catch (err) {
        console.error('Error in getMe:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProfileByCurrentUserEmail = async (req, res) => {
    try {
        const userId = req.user.sub;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get current user's email from user object
        const userEmail = req.user.email;
        if (!userEmail) {
            return res.status(400).json({ error: 'User email not found' });
        }

        console.log(`Getting profile for current user email: ${userEmail}`);

        // Get profile by email
        const profile = await profileService.getProfileByEmail(userEmail);

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found for this email' });
        }

        res.json(profile);
    } catch (err) {
        console.error('Get profile by current user email error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfileByCurrentUserEmail = async (req, res) => {
    try {
        const userId = req.user.sub;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log(`Updating profile for user ${userId} with data:`, updates);

        // Get current user's email from user object
        const userEmail = req.user.email;
        if (!userEmail) {
            return res.status(400).json({ error: 'User email not found' });
        }

        console.log(`Getting profile for current user email: ${userEmail}`);

        // Get profile by email
        const existingProfile = await profileService.getProfileByEmail(userEmail);

        let result;
        if (!existingProfile) {
            // Profile doesn't exist, create it with the user's email
            const profileData = {
                ...updates,
                email: userEmail
            };
            result = await profileService.createProfile(userId, profileData);
            console.log('Profile created successfully:', result);
        } else {
            // Profile exists, update it
            result = await profileService.updateProfile(existingProfile.id, updates);
            console.log('Profile updated successfully:', result);
        }

        res.json(result);
    } catch (err) {
        console.error('Update profile by current user email error:', err);
        res.status(500).json({ error: err.message });
    }
}; 