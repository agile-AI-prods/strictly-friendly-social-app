const settingsService = require('../services/settingsService');

// Save or create user settings
exports.saveUserSettings = async (req, res) => {
  try {
    const { email, theme_settings } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!theme_settings) {
      return res.status(400).json({ error: 'Theme settings are required' });
    }

    // Validate theme settings structure
    const requiredFields = ['theme', 'autoTheme', 'primaryColor', 'fontSize'];
    for (const field of requiredFields) {
      if (!(field in theme_settings)) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    try {
      const result = await settingsService.saveUserSettings(email, theme_settings);
      res.status(201).json({
        success: true,
        message: 'Settings saved successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Save settings error:', error);
      return res.status(500).json({
        error: 'Failed to save settings',
        message: 'Unable to save user settings'
      });
    }
  } catch (err) {
    console.error('Settings controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user settings by email
exports.getUserSettings = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await settingsService.getUserSettings(email);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      if (error.message === 'Settings not found') {
        // Return default settings for new users instead of 404
        return res.json({
          success: true,
          message: 'No settings found, using defaults',
          data: {
            email,
            theme: 'light',
            auto_theme: 'false',
            primary_color: 'blue',
            font_size: 'medium'
          }
        });
      }

      console.error('Get settings error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve settings',
        message: 'Unable to get user settings'
      });
    }
  } catch (err) {
    console.error('Settings controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update existing user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const { email } = req.params;
    const { theme_settings } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!theme_settings) {
      return res.status(400).json({ error: 'Theme settings are required' });
    }

    // Validate theme settings structure
    const requiredFields = ['theme', 'autoTheme', 'primaryColor', 'fontSize'];
    for (const field of requiredFields) {
      if (!(field in theme_settings)) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    try {
      const result = await settingsService.saveUserSettings(email, theme_settings);
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      if (error.message === 'Settings not found') {
        return res.status(404).json({
          error: 'Settings not found',
          message: 'No settings found for this user'
        });
      }

      console.error('Update settings error:', error);
      return res.status(500).json({
        error: 'Failed to update settings',
        message: 'Unable to update user settings'
      });
    }
  } catch (err) {
    console.error('Settings controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save or create general settings
exports.saveGeneralSettings = async (req, res) => {
  try {
    const { email, general_settings } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!general_settings) {
      return res.status(400).json({ error: 'General settings are required' });
    }

    // Validate general settings structure - at least one field should be present
    const allowedFields = ['follow_me', 'profile_photos', 'birth', 'bio', 'email_setting', 'activity_notifications', 'comment_notifications', 'like_notifications', 'login_alerts'];
    const hasValidField = allowedFields.some(field => field in general_settings);
    
    if (!hasValidField) {
      return res.status(400).json({ error: 'At least one general setting field is required' });
    }

    try {
      const result = await settingsService.saveGeneralSettings(email, general_settings);
      res.status(201).json({
        success: true,
        message: 'General settings saved successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Save general settings error:', error);
      return res.status(500).json({
        error: 'Failed to save general settings',
        message: 'Unable to save user general settings'
      });
    }
  } catch (err) {
    console.error('General settings controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update existing general settings
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { email } = req.params;
    const { general_settings } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!general_settings) {
      return res.status(400).json({ error: 'General settings are required' });
    }

    // Validate general settings structure - at least one field should be present
    const allowedFields = ['follow_me', 'profile_photos', 'birth', 'bio', 'email_setting', 'activity_notifications', 'comment_notifications', 'like_notifications', 'login_alerts'];
    const hasValidField = allowedFields.some(field => field in general_settings);
    
    if (!hasValidField) {
      return res.status(400).json({ error: 'At least one general setting field is required' });
    }

    try {
      const result = await settingsService.saveGeneralSettings(email, general_settings);
      res.json({
        success: true,
        message: 'General settings updated successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      if (error.message === 'Settings not found') {
        return res.status(404).json({
          error: 'Settings not found',
          message: 'No settings found for this user'
        });
      }

      console.error('Update general settings error:', error);
      return res.status(500).json({
        error: 'Failed to update general settings',
        message: 'Unable to update user general settings'
      });
    }
  } catch (err) {
    console.error('General settings controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check follow_me status for a user
exports.checkFollowMeStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await settingsService.checkFollowMeStatus(email);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Check follow me status error:', error);
      return res.status(500).json({
        error: 'Failed to check follow me status',
        message: 'Unable to check user follow me status'
      });
    }
  } catch (err) {
    console.error('Follow me status controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check birthday privacy setting for a user
exports.checkBirthdayPrivacy = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await settingsService.checkBirthdayPrivacy(email);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Check birthday privacy error:', error);
      return res.status(500).json({
        error: 'Failed to check birthday privacy',
        message: 'Unable to check user birthday privacy setting'
      });
    }
  } catch (err) {
    console.error('Birthday privacy controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check bio privacy setting for a user
exports.checkBioPrivacy = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await settingsService.checkBioPrivacy(email);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Check bio privacy error:', error);
      return res.status(500).json({
        error: 'Failed to check bio privacy',
        message: 'Unable to check user bio privacy setting'
      });
    }
  } catch (err) {
    console.error('Bio privacy controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check email privacy setting for a user
exports.checkEmailPrivacy = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const result = await settingsService.checkEmailPrivacy(email);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      console.error('Check email privacy error:', error);
      return res.status(500).json({
        error: 'Failed to check email privacy',
        message: 'Unable to check user email privacy setting'
      });
    }
  } catch (err) {
    console.error('Email privacy controller error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 