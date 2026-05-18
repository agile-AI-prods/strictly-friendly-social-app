import api from './axiosInstance';

export interface ThemeSettings {
  theme: 'light' | 'dark';
  autoTheme: boolean;
  primaryColor: string;
  fontSize: string;
}

export interface GeneralSettings {
  follow_me?: string;
  profile_photos?: string;
  birth?: string;
  bio?: string;
  email_setting?: string;
  activity_notifications?: string;
  comment_notifications?: string;
  like_notifications?: string;
  login_alerts?: string;
}

export interface UserSettings {
  email: string;
  theme: string;
  auto_theme: string;
  primary_color: string;
  font_size: string;
  follow_me?: string;
  profile_photos?: string;
}

// Save or update user settings
export const saveUserSettings = (email: string, themeSettings: ThemeSettings) =>
  api.post('/api/settings', {
    email,
    theme_settings: themeSettings
  }).then(res => res.data);

// Save or update general settings
export const saveGeneralSettings = (email: string, generalSettings: GeneralSettings) =>
  api.post('/api/settings/general', {
    email,
    general_settings: generalSettings
  }).then(res => res.data);

// Get user settings by email
export const getUserSettings = (email: string) =>
  api.get(`/api/settings/${encodeURIComponent(email)}`).then(res => {
    const data = res.data;
    
    // Helper function to safely convert string to boolean
    const stringToBoolean = (value: string): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return false;
    };
    
    // Transform the database fields back to the expected format
    if (data.data) {
      const dbData = data.data;
      return {
        ...data,
        data: {
          ...dbData,
          theme_settings: {
            theme: dbData.theme as 'light' | 'dark',
            autoTheme: stringToBoolean(dbData.auto_theme), // Fixed: Better boolean conversion
            primaryColor: dbData.primary_color,
            fontSize: dbData.font_size
          },
          general_settings: {
            follow_me: dbData.follow_me,
            birth: dbData.birth,
            bio: dbData.bio,
            email_setting: dbData.email_setting,
            activity_notifications: dbData.activity_notifications,
            comment_notifications: dbData.comment_notifications,
            like_notifications: dbData.like_notifications,
            login_alerts: dbData.login_alerts
          }
        }
      };
    } else if (data) {
      // Handle case where data is directly the database record
      return {
        success: true,
        data: {
          ...data,
          theme_settings: {
            theme: data.theme as 'light' | 'dark',
            autoTheme: stringToBoolean(data.auto_theme), // Fixed: Better boolean conversion
            primaryColor: data.primary_color,
            fontSize: data.font_size
          },
          general_settings: {
            follow_me: data.follow_me,
            birth: data.birth,
            bio: data.bio,
            email_setting: data.email_setting,
            activity_notifications: data.activity_notifications,
            comment_notifications: data.comment_notifications,
            like_notifications: data.like_notifications,
            login_alerts: data.login_alerts
          }
        }
      };
    }
    return data;
  });

// Update existing user settings
export const updateUserSettings = (email: string, themeSettings: ThemeSettings) =>
  api.put(`/api/settings/${encodeURIComponent(email)}`, {
    theme_settings: themeSettings
  }).then(res => res.data);

// Update existing general settings
export const updateGeneralSettings = (email: string, generalSettings: GeneralSettings) =>
  api.put(`/api/settings/general/${encodeURIComponent(email)}`, {
    general_settings: generalSettings
  }).then(res => res.data);

// Check if user allows following (follow_me setting)
export const checkFollowMeStatus = (email: string) =>
  api.get(`/api/settings/follow-me/${encodeURIComponent(email)}`).then(res => res.data);

// Check birthday privacy setting
export const checkBirthdayPrivacy = (email: string) =>
  api.get(`/api/settings/birthday-privacy/${encodeURIComponent(email)}`).then(res => res.data);

// Check bio privacy setting
export const checkBioPrivacy = (email: string) =>
  api.get(`/api/settings/bio-privacy/${encodeURIComponent(email)}`).then(res => res.data);

// Check email privacy setting
export const checkEmailPrivacy = (email: string) =>
  api.get(`/api/settings/email-privacy/${encodeURIComponent(email)}`).then(res => res.data); 