import { checkBioPrivacy } from '../api/settingsApi';
import { ConnectionStatus } from '../types';

export const shouldShowBio = async (
  targetUserEmail: string,
  currentUserId: string | undefined,
  targetUserId: string,
  connectionStatus: ConnectionStatus | undefined
): Promise<boolean> => {
  console.log('shouldShowBio called with:', { targetUserEmail, currentUserId, targetUserId, connectionStatus });
  
  // Always show bio to the user themselves
  if (currentUserId === targetUserId) {
    console.log('Viewing own profile, showing bio');
    return true;
  }
  
  // Don't show bio to non-logged-in users
  if (!currentUserId) {
    console.log('Not logged in, hiding bio');
    return false;
  }

  try {
    const result = await checkBioPrivacy(targetUserEmail);
    const bioPrivacy = result?.data?.bio || 'contacts';
    console.log('Bio privacy check result:', { result, bioPrivacy, connectionStatus });

    switch (bioPrivacy) {
      case 'everybody':
        console.log('Privacy: everybody, showing bio');
        return true;
      case 'contacts':
        const isConnected = connectionStatus === 'accepted';
        console.log('Privacy: contacts, connection status:', connectionStatus, 'showing:', isConnected);
        return isConnected;
      case 'nobody':
        console.log('Privacy: nobody, hiding bio');
        return false;
      default:
        const defaultResult = connectionStatus === 'accepted';
        console.log('Privacy: default, connection status:', connectionStatus, 'showing:', defaultResult);
        return defaultResult;
    }
  } catch (error) {
    console.error('Error checking bio privacy:', error);
    return false;
  }
};
