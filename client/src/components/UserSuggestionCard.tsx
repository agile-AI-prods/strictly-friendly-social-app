import { Avatar, Button } from 'antd';
import { UserPlus, MapPin, Heart, MessageCircle } from 'lucide-react';
import { Profile } from '../types';
import { FollowButton } from './FollowButton';
import { LikeButton } from './LikeButton';
import { ConnectionButton } from './ConnectionButton';
import { Link, useNavigate } from 'react-router-dom';
import { calculateDistance } from '../utils/location';
import { useTheme } from '../context/ThemeContext';
import { useAvatarPrivacy } from '../hooks/useAvatarPrivacy';

interface UserSuggestionCardProps {
  user: Profile;
  currentUserLocation?: { latitude: number; longitude: number };
  reasons?: string[];
  showReasons?: boolean;
  className?: string;
  friendsCount?: number;
}

export const UserSuggestionCard = ({
  user,
  currentUserLocation,
  reasons = [],
  showReasons = true,
  className = '',
  friendsCount
}: UserSuggestionCardProps) => {
  const navigate = useNavigate();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  
  // Check avatar privacy settings
  const { avatarUrl } = useAvatarPrivacy(user.id, user.email, user.photo_url);

  const distance = currentUserLocation && user.location
    ? calculateDistance(
      currentUserLocation.latitude,
      currentUserLocation.longitude,
      user.location.latitude,
      user.location.longitude
    )
    : null;

  return (
    <div className={`rounded-lg p-1 shadow-sm border ${className} ${
      effectiveTheme === 'dark' 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center space-x-1 ">
        <Link to={`/profile/${user.id}`}>
          <Avatar
            src={avatarUrl}
            size={50}
            className="flex-shrink-0"
          />
        </Link>

        <div className=" min-w-0">
          <div className=" mb-1">
            <p className={`font-semibold truncate ${getFontSizeClassForElement('text-sm')} ${
              effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {user.name}
            </p>
            <p className={`truncate ${getFontSizeClassForElement('text-xs')} ${
              effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {user.email}
            </p>
          </div>


          <div className="flex space-x-2">

          </div>
        </div>
      </div>
    </div>
  );
}; 