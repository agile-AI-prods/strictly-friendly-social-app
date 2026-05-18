import { getUserSettings } from '../api/settingsApi';

interface AvatarPrivacyOptions {
  currentUserId?: string;
  targetUserId: string;
  targetUserEmail?: string;
  isConnected?: boolean;
}

/**
 * Check if user's avatar should be shown based on their privacy settings
 * @param options Configuration options
 * @returns Promise<boolean> - true if avatar should be shown, false otherwise
 */
export const shouldShowUserAvatar = async (options: AvatarPrivacyOptions): Promise<boolean> => {
  const { currentUserId, targetUserId, targetUserEmail, isConnected = false } = options;

  // Always show own avatar
  if (!currentUserId || !targetUserEmail || currentUserId === targetUserId) {
    return true;
  }

  try {
    // Get user's profile_photos setting
    const settingsResult = await getUserSettings(targetUserEmail);
    let profilePhotosSettings = 'everybody'; // default
    
    if (settingsResult?.data?.general_settings?.profile_photos) {
      profilePhotosSettings = settingsResult.data.general_settings.profile_photos;
    } else if (settingsResult?.data?.profile_photos) {
      // Fallback for direct property
      profilePhotosSettings = settingsResult.data.profile_photos;
    }

    console.log('Avatar Privacy Check:', {
      targetUserId,
      targetUserEmail,
      profilePhotosSettings,
      currentUserId,
      isConnected
    });

    switch (profilePhotosSettings) {
      case 'everybody':
        return true;
        
      case 'contacts':
        return isConnected;
        
      case 'nobody':
        return false;
        
      default:
        return true; // Default to show on unknown setting
    }
  } catch (error) {
    console.error('Failed to check avatar privacy:', error);
    // Default to show avatar on error
    return true;
  }
};

/**
 * Get the appropriate avatar URL based on privacy settings
 * @param shouldShow Whether to show the actual avatar
 * @param actualPhotoUrl The user's actual photo URL
 * @param defaultAvatarUrl The default avatar URL to use when privacy is applied
 * @returns The URL to use for the avatar
 */
export const getAvatarUrl = (
  shouldShow: boolean,
  actualPhotoUrl?: string,
  defaultAvatarUrl: string = 'https://randomuser.me/api/portraits/men/1.jpg'
): string => {
  return shouldShow ? (actualPhotoUrl || defaultAvatarUrl) : defaultAvatarUrl;
};