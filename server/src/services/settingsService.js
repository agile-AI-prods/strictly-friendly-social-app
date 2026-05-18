const { getDatabase } = require('../config/database');

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// MongoDB: Save or create user settings
exports.saveUserSettings = async (email, themeSettings) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    // Check if settings already exist
    const existingSettings = await settingsCollection.findOne({ email });
    
    if (existingSettings) {
      // Update existing settings
      const result = await settingsCollection.updateOne(
        { email },
        {
          $set: {
            theme: themeSettings.theme,
            auto_theme: themeSettings.autoTheme ? 'true' : 'false',
            primary_color: themeSettings.primaryColor,
            font_size: themeSettings.fontSize,
            updated_at: new Date(),
            font_size: themeSettings.fontSize,
            updated_at: new Date()
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to update settings');
      }
      
      return await settingsCollection.findOne({ email });
    } else {
      // Create new settings
      // Generate new UUID for the settings
      const settingsId = new UUID();
      
      const newSettings = {
        _id: settingsId,
        email,
        theme: themeSettings.theme,
        auto_theme: themeSettings.autoTheme ? 'true' : 'false',
        primary_color: themeSettings.primaryColor,
        font_size: themeSettings.fontSize,
        follow_me: false,
        profile_photos: 'everybody',
        birth: 'everybody',
        bio: 'everybody',
        email_setting: 'everybody',
        activity_notifications: true,
        comment_notifications: true,
        like_notifications: true,
        login_alerts: true,
        updated_at: new Date()
      };
      
      const result = await settingsCollection.insertOne(newSettings);
      return { ...newSettings, _id: result.insertedId };
    }
  } catch (error) {
    console.error('Error in saveUserSettings:', error);
    throw error;
  }
};

// MongoDB: Get user settings by email
exports.getUserSettings = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const settings = await settingsCollection.findOne({ email });
    
    if (!settings) {
      // Return default settings if none found
      return {
        email: email,
        theme: 'light',
        auto_theme: 'false',
        auto_theme: 'false',
        primary_color: 'blue',
        font_size: 'medium',
        follow_me: false,
        profile_photos: 'everybody',
        birth: 'everybody',
        bio: 'everybody',
        email_setting: 'everybody',
        activity_notifications: true,
        comment_notifications: true,
        like_notifications: true,
        login_alerts: true
      };
    }
    
    return settings;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    throw error;
  }
};

// MongoDB: Update existing user settings
exports.updateUserSettings = async (email, themeSettings) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const result = await settingsCollection.updateOne(
      { email },
      {
        $set: {
          theme: themeSettings.theme,
          auto_theme: themeSettings.autoTheme ? 'true' : 'false',
          primary_color: themeSettings.primaryColor,
          font_size: themeSettings.fontSize,
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Settings not found');
    }
    
    return await settingsCollection.findOne({ email });
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    throw error;
  }
};

// MongoDB: Save or update general settings
exports.saveGeneralSettings = async (email, generalSettings) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    // Check if settings already exist
    const existingSettings = await settingsCollection.findOne({ email });
    
    if (existingSettings) {
      // Update existing settings
      const result = await settingsCollection.updateOne(
        { email },
        {
          $set: {
            ...generalSettings,
            updated_at: new Date()
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to update general settings');
      }
      
      return await settingsCollection.findOne({ email });
    } else {
      // Create new settings with general settings
      // Generate new UUID for the settings
      const settingsId = new UUID();
      
      const newSettings = {
        _id: settingsId,
        email,
        theme: 'light',
        auto_theme: 'false',
        primary_color: 'blue',
        font_size: 'medium',
        ...generalSettings,
        updated_at: new Date()
      };
      
      const result = await settingsCollection.insertOne(newSettings);
      return { ...newSettings, _id: result.insertedId };
    }
  } catch (error) {
    console.error('Error in saveGeneralSettings:', error);
    throw error;
  }
};

// MongoDB: Update existing general settings
exports.updateGeneralSettings = async (email, generalSettings) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const result = await settingsCollection.updateOne(
      { email },
      {
        $set: {
          ...generalSettings,
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Settings not found');
    }
    
    return await settingsCollection.findOne({ email });
  } catch (error) {
    console.error('Error in updateGeneralSettings:', error);
    throw error;
  }
};

// MongoDB: Check follow me status
exports.checkFollowMeStatus = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const settings = await settingsCollection.findOne({ email });
    
    if (!settings) {
      // Return default value if no settings found
      return { follow_me: false };
    }
    
    return { follow_me: settings.follow_me || false };
  } catch (error) {
    console.error('Error in checkFollowMeStatus:', error);
    throw error;
  }
};

// MongoDB: Check birthday privacy setting
exports.checkBirthdayPrivacy = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const settings = await settingsCollection.findOne({ email });
    
    if (!settings) {
      // Return default value if no settings found
      return { birth: 'everybody' };
    }
    
    return { birth: settings.birth || 'everybody' };
  } catch (error) {
    console.error('Error in checkBirthdayPrivacy:', error);
    throw error;
  }
};

// MongoDB: Check bio privacy setting
exports.checkBioPrivacy = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const settings = await settingsCollection.findOne({ email });
    
    if (!settings) {
      // Return default value if no settings found
      return { bio: 'everybody' };
    }
    
    return { bio: settings.bio || 'everybody' };
  } catch (error) {
    console.error('Error in checkBioPrivacy:', error);
    throw error;
  }
};

// MongoDB: Check email privacy setting
exports.checkEmailPrivacy = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const settings = await settingsCollection.findOne({ email });
    
    if (!settings) {
      // Return default value if no settings found
      return { email_setting: 'everybody' };
    }
    
    return { email_setting: settings.email_setting || 'everybody' };
  } catch (error) {
    console.error('Error in checkEmailPrivacy:', error);
    throw error;
  }
};

// MongoDB: Update email in settings
exports.updateSettingsEmail = async (oldEmail, newEmail) => {
  if (!isValidEmail(oldEmail) || !isValidEmail(newEmail)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    // Check if settings exist for the old email
    const existingSettings = await settingsCollection.findOne({ email: oldEmail });
    
    if (!existingSettings) {
      // No settings found for old email, nothing to update
      console.log(`No settings found for old email: ${oldEmail}`);
      return null;
    }
    
    // Update the email in settings
    const result = await settingsCollection.updateOne(
      { email: oldEmail },
      { $set: { email: newEmail } }
    );
    
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update email in settings');
    }
    
    console.log(`Settings email updated from ${oldEmail} to ${newEmail}`);
    return await settingsCollection.findOne({ email: newEmail });
  } catch (error) {
    console.error('Error in updateSettingsEmail:', error);
    throw error;
  }
};

// MongoDB: Get all user settings (for admin purposes)
exports.getAllUserSettings = async () => {
  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    return await settingsCollection.find({}).toArray();
  } catch (error) {
    console.error('Error in getAllUserSettings:', error);
    throw error;
  }
};

// MongoDB: Delete user settings
exports.deleteUserSettings = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const settingsCollection = db.collection('settings');
    
    const result = await settingsCollection.deleteOne({ email });
    
    if (result.deletedCount === 0) {
      throw new Error('Settings not found');
    }
    
    return { success: true, message: 'Settings deleted successfully' };
  } catch (error) {
    console.error('Error in deleteUserSettings:', error);
    throw error;
  }
}; 