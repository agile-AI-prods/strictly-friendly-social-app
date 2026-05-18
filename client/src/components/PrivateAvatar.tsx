import React from 'react';
import { useAvatarPrivacy } from '../hooks/useAvatarPrivacy';
import { selectUserStatus } from '../store/slices/presenceSlice';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../context/ThemeContext';

interface PrivateAvatarProps {
  userId: string;
  userEmail?: string;
  photoUrl?: string;
  size?: number;
  alt?: string;
  className?: string;
  showOnlineStatus?: boolean;
}

export const PrivateAvatar: React.FC<PrivateAvatarProps> = ({
  userId,
  userEmail,
  photoUrl,
  size = 40,
  alt = 'User',
  className = '',
  showOnlineStatus = false
}) => {
  const { avatarUrl } = useAvatarPrivacy(userId, userEmail, photoUrl);
  const userStatus = useAppSelector(selectUserStatus(userId));
  const { effectiveTheme } = useTheme();

  const getOnlineStatusIndicator = (userId: string) => {
    const status = userStatus;
    if (status === 'online') return 'bg-green-500';
    if (status === 'idle') return 'bg-yellow-500';
    return effectiveTheme === 'dark' ? 'bg-gray-500' : 'bg-gray-400';
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <img
        src={avatarUrl}
        alt={alt}
        className="w-full h-full rounded-full object-cover border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
        style={{ width: size, height: size }}
      />
      {showOnlineStatus && (
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getOnlineStatusIndicator(userId)}`}></div>
      )}
    </div>
  );
};