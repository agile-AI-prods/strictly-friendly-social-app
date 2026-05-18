import { useState } from 'react';
import { checkBirthdayPrivacy } from '../api/settingsApi';
import { ConnectionStatus } from '../types';

/**
 * Determines if a user's birthday should be visible based on their privacy settings
 * @param targetUserEmail - Email of the user whose birthday we want to view
 * @param currentUserId - ID of the current user viewing the profile
 * @param targetUserId - ID of the user whose birthday we want to view
 * @param connectionStatus - Connection status between current user and target user
 * @returns Promise<boolean> - true if birthday should be visible, false otherwise
 */
export const shouldShowBirthday = async (
  targetUserEmail: string,
  currentUserId: string | undefined,
  targetUserId: string,
  connectionStatus: ConnectionStatus | undefined
): Promise<boolean> => {
  console.log('shouldShowBirthday called with:', {
    targetUserEmail,
    currentUserId,
    targetUserId,
    connectionStatus
  });

  // If viewing own profile, always show birthday
  if (currentUserId === targetUserId) {
    console.log('Viewing own profile, showing birthday');
    return true;
  }

  // If not logged in, don't show birthday
  if (!currentUserId) {
    console.log('Not logged in, hiding birthday');
    return false;
  }

  try {
    // Get birthday privacy setting
    const result = await checkBirthdayPrivacy(targetUserEmail);
    const birthdayPrivacy = result?.data?.birth || 'contacts';
    
    console.log('Birthday privacy check result:', {
      result,
      birthdayPrivacy,
      connectionStatus
    });

    switch (birthdayPrivacy) {
      case 'everybody':
        console.log('Privacy: everybody, showing birthday');
        return true;
      case 'contacts':
        // Show only if users are connected (friends)
        const isConnected = connectionStatus === 'accepted';
        console.log('Privacy: contacts, connection status:', connectionStatus, 'showing:', isConnected);
        return isConnected;
      case 'nobody':
        console.log('Privacy: nobody, hiding birthday');
        return false;
      default:
        // Default to contacts level privacy
        const defaultResult = connectionStatus === 'accepted';
        console.log('Privacy: default, connection status:', connectionStatus, 'showing:', defaultResult);
        return defaultResult;
    }
  } catch (error) {
    console.error('Error checking birthday privacy:', error);
    // Default to not showing birthday on error
    return false;
  }
};

/**
 * Hook to manage birthday visibility state
 */
export const useBirthdayVisibility = () => {
  const [birthdayVisibility, setBirthdayVisibility] = useState<{ [userId: string]: boolean }>({});
  const [loading, setLoading] = useState<{ [userId: string]: boolean }>({});

  const checkBirthdayVisibility = async (
    targetUserEmail: string,
    currentUserId: string | undefined,
    targetUserId: string,
    connectionStatus: ConnectionStatus | undefined
  ) => {
    if (birthdayVisibility[targetUserId] !== undefined) {
      return birthdayVisibility[targetUserId];
    }

    setLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const visible = await shouldShowBirthday(targetUserEmail, currentUserId, targetUserId, connectionStatus);
      setBirthdayVisibility(prev => ({ ...prev, [targetUserId]: visible }));
      return visible;
    } catch (error) {
      console.error('Error checking birthday visibility:', error);
      setBirthdayVisibility(prev => ({ ...prev, [targetUserId]: false }));
      return false;
    } finally {
      setLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  return {
    birthdayVisibility,
    loading,
    checkBirthdayVisibility
  };
};
