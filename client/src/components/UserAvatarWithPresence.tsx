// import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectUserStatus } from '../store/slices/presenceSlice';
import { useTheme } from '../context/ThemeContext';
import { useAvatarPrivacy } from '../hooks/useAvatarPrivacy';

interface Props {
  userId: string;
  userEmail?: string;
  photoUrl?: string;
  size?: number; // px, default 40
  alt?: string;
  className?: string;
}

export const UserAvatarWithPresence: React.FC<Props> = ({
  userId,
  userEmail,
  photoUrl,
  size = 40,
  alt = 'User',
  className = '',
}) => {
  const userStatus = useAppSelector(selectUserStatus(userId));
  const { effectiveTheme } = useTheme();
  
  // Check avatar privacy settings
  const { avatarUrl } = useAvatarPrivacy(userId, userEmail, photoUrl);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>

      <img
        src={avatarUrl}
        alt={alt}
        className={`rounded-full object-cover border-2 ${effectiveTheme === 'dark' ? 'border-gray-600 filter brightness-90' : 'border-gray-300'}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`
          absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${effectiveTheme === 'dark' ? 'border-gray-800' : 'border-white'}
          ${userStatus === 'online'
            ? 'bg-green-500'
            : userStatus === 'idle'
              ? 'bg-yellow-500'
              : effectiveTheme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
          }
        `}
        title={userStatus}
      />
    </div>
  );
};
