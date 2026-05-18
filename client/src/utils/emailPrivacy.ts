import { checkEmailPrivacy } from '../api/settingsApi';
import { ConnectionStatus } from '../types';

export const shouldShowEmail = async (
  targetUserEmail: string,
  currentUserId: string | undefined,
  targetUserId: string,
  connectionStatus: ConnectionStatus | undefined
): Promise<boolean> => {
  console.log('shouldShowEmail called with:', { targetUserEmail, currentUserId, targetUserId, connectionStatus });
  
  // Always show email to the user themselves
  if (currentUserId === targetUserId) {
    console.log('Viewing own profile, showing email');
    return true;
  }
  
  // Don't show email if not logged in
  if (!currentUserId) {
    console.log('Not logged in, hiding email');
    return false;
  }

  try {
    const result = await checkEmailPrivacy(targetUserEmail);
    const emailPrivacy = result?.data?.email_setting || 'contacts';
    console.log('Email privacy check result:', { result, emailPrivacy, connectionStatus });

    switch (emailPrivacy) {
      case 'everybody':
        console.log('Privacy: everybody, showing email');
        return true;
      case 'contacts':
        const isConnected = connectionStatus === 'accepted';
        console.log('Privacy: contacts, connection status:', connectionStatus, 'showing:', isConnected);
        return isConnected;
      case 'nobody':
        console.log('Privacy: nobody, hiding email');
        return false;
      default:
        const defaultResult = connectionStatus === 'accepted';
        console.log('Privacy: default, connection status:', connectionStatus, 'showing:', defaultResult);
        return defaultResult;
    }
  } catch (error) {
    console.error('Error checking email privacy:', error);
    return false;
  }
};
