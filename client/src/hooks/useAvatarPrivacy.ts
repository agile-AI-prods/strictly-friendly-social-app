import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { shouldShowUserAvatar, getAvatarUrl } from '../utils/avatarPrivacy';
import { selectConnectionStatuses } from '../store/slices/connectionSlice';

interface UseAvatarPrivacyResult {
  shouldShowAvatar: boolean;
  avatarUrl: string;
  isLoading: boolean;
}

/**
 * Custom hook to handle avatar privacy logic
 * @param targetUserId The ID of the user whose avatar we want to show
 * @param targetUserEmail The email of the user whose avatar we want to show
 * @param actualPhotoUrl The actual photo URL of the user
 * @param defaultAvatarUrl Optional custom default avatar URL
 * @returns Object with shouldShowAvatar, avatarUrl, and loading state
 */
export const useAvatarPrivacy = (
  targetUserId: string,
  targetUserEmail?: string,
  actualPhotoUrl?: string,
  defaultAvatarUrl?: string
): UseAvatarPrivacyResult => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const connectionStatuses = useSelector(selectConnectionStatuses);
  
  const [shouldShowAvatar, setShouldShowAvatar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const finalDefaultUrl = defaultAvatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg';

  useEffect(() => {
    const checkAvatarPrivacy = async () => {
      // Always show own avatar
      if (!currentUser || !targetUserEmail || currentUser.id === targetUserId) {
        setShouldShowAvatar(true);
        return;
      }

      setIsLoading(true);
      
      try {
        // Check connection status
        const connectionStatus = connectionStatuses[targetUserId];
        const isConnected = connectionStatus === 'accepted';

        const shouldShow = await shouldShowUserAvatar({
          currentUserId: currentUser.id,
          targetUserId,
          targetUserEmail,
          isConnected
        });

        setShouldShowAvatar(shouldShow);
      } catch (error) {
        console.error('Avatar privacy check failed:', error);
        setShouldShowAvatar(true); // Default to show on error
      } finally {
        setIsLoading(false);
      }
    };

    checkAvatarPrivacy();
  }, [targetUserId, targetUserEmail, currentUser?.id, connectionStatuses]);

  const avatarUrl = getAvatarUrl(shouldShowAvatar, actualPhotoUrl, finalDefaultUrl);

  return {
    shouldShowAvatar,
    avatarUrl,
    isLoading
  };
};