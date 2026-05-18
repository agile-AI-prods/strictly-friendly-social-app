import { Avatar, Button, Card } from 'antd';
import { Profile, ConnectionStatus } from '../types';
import { UserPlus, UserCheck, MessageCircle, Loader2 } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFollowingCount, fetchFollowersCount } from '../store/slices/followSlice';
import { fetchLikesCount } from '../store/slices/likeSlice';
import { selectAuthUser } from '../store/slices/authSlice';
import { useTheme } from '../context/ThemeContext';
import { useAvatarPrivacy } from '../hooks/useAvatarPrivacy';
import { addFriend, checkFriendStatus, selectIsFriend } from '../store/slices/friendSlice';
import { addUserToConnectedUsers } from '../store/slices/messageSlice';

interface UserCardProps {
  senderId: string;
  receiverId: string;
  user: Profile;
  distance?: number;
  unit?: 'km' | 'mi';
  onAddFriend?: () => void;
  showMessageButton?: boolean;
  showFriendButton?: boolean;
  friendsCount?: number;
  isFriend?: boolean;
}

export const UserCard = ({
  user,
  distance,
  unit = 'km',
  onAddFriend,
  showMessageButton = true,
  showFriendButton = true,
  isFriend = false
}: UserCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const [friendLoading, setFriendLoading] = useState(false);

  // Check avatar privacy settings
  const { avatarUrl } = useAvatarPrivacy(user.id, user.email, user.photo_url);

  // Select counts from Redux store
  const followingCount = useAppSelector((state) => state.follows.followingCounts[user.id]);
  const followersCount = useAppSelector((state) => state.follows.followersCounts[user.id]);
  const likesCount = useAppSelector((state) => state.likes.counts[user.id]?.profile); // Assuming likes for 'profile' type

  // Get friend status from Redux
  const isFriendFromStore = useAppSelector(selectIsFriend(user.id));
  const actualIsFriend = isFriend !== undefined ? isFriend : isFriendFromStore;

  // Format created_at date
  const formattedCreatedAt = user.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'N/A';

  useEffect(() => {
    // Fetch social counts
    dispatch(fetchFollowingCount(user.id));
    dispatch(fetchFollowersCount(user.id));
    dispatch(fetchLikesCount({ targetId: user.id, targetType: 'profile' }));
  }, [dispatch, user.id]);

  // Check friend status on mount
  useEffect(() => {
    if (user.id) {
      dispatch(checkFriendStatus(user.id));
    }
  }, [user.id, dispatch]);

  const handleAddFriend = async () => {
    try {
      setFriendLoading(true);
      await dispatch(addFriend(user.id)).unwrap();
      onAddFriend?.();
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setFriendLoading(false);
    }
  };

  const handleMessage = () => {
    // Add user to connected users list if not already there
    dispatch(addUserToConnectedUsers({
      userId: user.id,
      userName: user.name,
      photo_url: user.photo_url
    }));
    navigate('/messages', { state: { selectedUserId: user.id } });
  };

  return (
    <Card key={user.id} className={`overflow-hidden shadow-md w-full h-full min-w-0 ${effectiveTheme === 'dark' ? 'bg-gray-900 border-gray-700' : ''
      }`}>
      <div className="relative h-40 -mx-6 -mt-8">
        <img
          src={user.cover_url || `https://picsum.photos/400/200?random=${user.id}`}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <Link to={`/profile/${user.id}`}>
          <Avatar
            src={avatarUrl}
            size={120}
            className="absolute -bottom-[72px] left-4 border-4 border-white"
          />
        </Link>
      </div>
      <div className="pl-32 pt-2">
        <h3 className={`${getFontSizeClassForElement('text-sm')} font-semibold ${effectiveTheme === 'dark' ? 'text-gray-100' : ''
          }`}>{user.name}</h3>
        {/* {user.bio && <p className="text-gray-500 text-sm">{user.bio}</p>} */}
        {distance !== undefined && (
          <p className={`${getFontSizeClassForElement('text-xs')} flex items-center mt-1 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <MapPin className="h-4 w-4 mr-1" />
            {distance.toFixed(1)}{unit} away
          </p>
        )}
        <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : ''
          }`}>{user.location?.city}</p>
      </div>
      <div className='pt-6 pb-8'>
        <table className={`min-w-full ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-100' : ''
          }`}>
          <tbody>
            <tr>
              <td className={`font-medium pr-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Age:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>{user.age}</td>
            </tr>
            <tr>
              <td className={`font-medium pr-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Since:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>{formattedCreatedAt}</td>
            </tr>
            {/* <tr>
              <td className="font-medium pr-2 align-top">Friends:</td>
              <td>
                {typeof friendsCount === 'number' ? friendsCount : 'Loading...'}
                {user.friends_avatars && user.friends_avatars.length > 0 && (
                  <div className="flex -space-x-2 mt-1 mb-2">
                    {user.friends_avatars.map(friend => (
                      <Avatar
                        key={friend.id}
                        src={friend.photo_url}
                        size={32}
                        alt={friend.name}
                        className="border-2 border-white"
                      />
                    ))}
                    {friendsCount && friendsCount > 3 && (
                      <span className="text-xs text-gray-500 ml-2">+{friendsCount - 3} more</span>
                    )}
                  </div>
                )}
              </td>
            </tr> */}
            <tr>
              <td className={`font-medium pr-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Following:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>{followingCount !== null ? followingCount : 'Loading...'}</td>
            </tr>
            <tr>
              <td className={`font-medium pr-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Followers:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>{followersCount !== null ? followersCount : 'Loading...'}</td>
            </tr>
            <tr>
              <td className={`font-medium pr-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Likes:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>{likesCount !== null ? likesCount : 'Loading...'}</td>
            </tr>
            <tr>
              <td className={`font-medium pr-2 align-top ${effectiveTheme === 'dark' ? 'text-gray-400' : ''}`}>Interests:</td>
              <td className={effectiveTheme === 'dark' ? 'text-gray-100' : ''}>
                {user.interests?.slice(0, 3).map(interest => interest.label).join(', ') || 'No interests'}
                {user.interests && user.interests.length > 3 && (
                  <span className={`${getFontSizeClassForElement('text-xs')} ml-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    +{user.interests.length - 3} more
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2 px-4 pb-4 space-y-2">
        {showMessageButton && (
          <Button
            type="default"
            icon={<MessageCircle className="h-4 w-4" />}
            onClick={handleMessage}
            className="w-full"
          >
            Message
          </Button>
        )}
        {showFriendButton && (
          <Button
            type={actualIsFriend ? "default" : "primary"}
            icon={actualIsFriend ? <UserCheck className="h-4 w-4" /> : friendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            onClick={handleAddFriend}
            disabled={actualIsFriend || friendLoading}
            className="w-full"
          >
            {actualIsFriend ? "Added to Friends" : "Add to Friends"}
          </Button>
        )}
      </div>
    </Card>
  );
};
