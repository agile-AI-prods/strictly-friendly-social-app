import { Link, useNavigate } from 'react-router-dom';
import { User, Users, MessageSquare, Image, Menu, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useEffect, useState } from 'react';
import { fetchConnectedUsers } from '../store/slices/messageSlice';
import { selectUserStatus, selectOnlineUsers } from '../store/slices/presenceSlice';
import { UserAvatarWithPresence } from '../components/UserAvatarWithPresence';
import { fetchFollowersCount } from '../store/slices/followSlice';
import { useTheme } from '../context/ThemeContext';

export const LeftSidebar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const connectedUsers = useAppSelector((state) => state.messages.connectedUsers);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const followerCount = useAppSelector(state => state.follows.followersCounts[user?.id || ''] || 0);
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const [collapsed, setCollapsed] = useState(true);

  const userName = user?.name || 'StrictlyFriendly User';
  const userAvatar = user?.photo_url || 'https://via.placeholder.com/64';
  const userStatus = useAppSelector(selectUserStatus(user?.id || ''));
  const onlineUserIds = useAppSelector(selectOnlineUsers);
  const onlineFriends = connectedUsers.filter(user => onlineUserIds.includes(user.userId));

  const handleUserClick = (userId: string) => {
    navigate(`/messages`, { state: { selectedUserId: userId } });
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (user) {
      console.log('fetchConnectedUsers in leftsidebar')
      dispatch(fetchConnectedUsers());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchFollowersCount(user.id));
    }
  }, [user, dispatch]);

  const navigationItems = [
    {
      key: 'discover',
      icon: <Users className="h-5 w-5" />,
      label: 'People Nearby',
      path: '/discover',
      color: 'text-purple-500'
    },
    {
      key: 'connections',
      icon: <User className="h-5 w-5" />,
      label: 'Friends',
      path: '/connections',
      color: 'text-red-500'
    },
    {
      key: 'messages',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Messages',
      path: '/messages',
      color: 'text-orange-500'
    },
    {
      key: 'activity',
      icon: <Image className="h-5 w-5" />,
      label: 'Strictly Ups',
      path: '/activities',
      color: 'text-blue-500'
    }
  ];

  return (
    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm flex flex-col h-full items-center transition-all duration-300 ${collapsed ? 'w-full md:w-16 lg:w-20' : 'w-full md:w-48 lg:w-56'
      }`}>
      {/* Toggle Button */}
      <div className="w-full p-2 flex justify-center">
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Content Container - Mobile: height transition, Desktop: always visible */}
      <div className={`w-full px-2 transition-all duration-300 md:max-h-full ${collapsed ? ' max-h-0 overflow-hidden' : 'max-h-screen'
        }`}>
        {/* User Profile Card */}
        <div className={`bg-${currentColor.primary} rounded-lg flex items-center justify-center text-white relative overflow-hidden transition-all duration-300 ${collapsed ? 'md:w-12 md:h-12 h-0 rounded-full p-0 ' : ' w-full'
          }`}>
          {collapsed ? (
            <div className="w-full h-full flex items-center justify-center">
              <UserAvatarWithPresence userId={user?.id || ''} userEmail={user?.email} photoUrl={userAvatar} size={40} alt={userName} />
            </div>
          ) : (
            <div className="relative p-4 w-fit">
              <UserAvatarWithPresence userId={user?.id || ''} userEmail={user?.email} photoUrl={userAvatar} size={64} alt={userName} />
              <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
                {userName}
                <span className={`text-xs font-semibold ${userStatus === 'online' ? 'text-green-600' :
                  userStatus === 'idle' ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                </span>
              </h3>
              <Link
                to={{
                  pathname: `/profile/${user?.id || ''}`,
                  search: '?tab=Friends&subtab=followers'
                }}
                className="text-sm text-center text-blue-600 hover:underline block"
              >
                {followerCount} followers
              </Link>
            </div>
          )}
        </div>


        {/* Navigation Links */}
        <div className={`w-full mb-6 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4 md:px-2'
          }`}>
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.key} className={`transition-all duration-200 ${collapsed ? 'px-0' : 'px-2'
                }`}>
                <Link
                  to={item.path}
                  className={`flex items-center  ${effectiveTheme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    } p-2 rounded-md transition-all duration-200 ${collapsed ? 'justify-center' : 'justify-center md:justify-start'
                    }`}
                >
                  <span className={`${item.color} transition-all duration-200`}>{item.icon}</span>
                  {!collapsed && (
                    <span className="ml-3 transition-all duration-200 opacity-100">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Online Section */}
        <div className="w-full">
          {!collapsed && <Link to={"/messages"}>
            <button className={`bg-${currentColor.primary} text-white w-full py-2 rounded-full mb-4 hover:bg-${currentColor.hover} shadow-lg ${getFontSizeClassForElement('text-sm')}`}>Chat online</button>
          </Link>}
          <div className="flex flex-wrap justify-center gap-2">
            {onlineFriends.length > 0 ? (
              onlineFriends.map((connectedUser) => (
                <button
                  key={connectedUser.userId}
                  onClick={() => handleUserClick(connectedUser.userId)}
                  className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full relative"
                >
                  <UserAvatarWithPresence userId={connectedUser.userId} userEmail={connectedUser.email} photoUrl={connectedUser.photo_url} size={40} alt={connectedUser.userName} />
                </button>
              ))
            ) : (
              !collapsed && <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No online friends</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}; 