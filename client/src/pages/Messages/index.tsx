import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chat } from './Chat';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import { Profile } from '../../types';
import { RootState, AppDispatch } from '../../store';
import {
  selectIsTyping,
  fetchConnectedUsers,
  resetUnreadCount,
  setActiveChatUserId,
} from '../../store/slices/messageSlice';
import { fetchProfileById } from '../../store/slices/userSlice';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

export const Messages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const isTyping = useSelector(selectIsTyping);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const location = useLocation();
  const connectedUsers = useSelector((state: RootState) => state.messages.connectedUsers)
  const loading = useSelector((state: RootState) => state.messages.loadingUsers);
  const onlineUsers = useSelector((state: RootState) => state.presence.onlineUsers);
  const userStatuses = useSelector((state: RootState) => state.presence.userStatuses);
  const isUserOnline = (userId: string) => onlineUsers.includes(userId);
  const getUserStatus = (userId: string) => userStatuses[userId] || 'offline';

  // Get profile from Redux store
  const selectedUserProfile = useSelector((state: RootState) =>
    selectedUserId ? state.users.profileById[selectedUserId] : null
  );
  // Request notification permission
  // useEffect(() => {
  //   if (Notification.permission !== 'granted') {
  //     Notification.requestPermission();
  //   }
  // }, []);

  // Fetch connected users on mount
  useEffect(() => {
    if (authUser) {
      dispatch(fetchConnectedUsers());
    }
  }, [authUser, dispatch]);

  // Handle user selection and fetch profile via Redux
  useEffect(() => {
    if (selectedUserId && !selectedUserProfile) {
      dispatch(fetchProfileById(selectedUserId));
    }
  }, [selectedUserId, selectedUserProfile, dispatch]);

  // Update selectedUser when profile is loaded from Redux
  useEffect(() => {
    if (selectedUserProfile) {
      setSelectedUser(selectedUserProfile);
    }
  }, [selectedUserProfile]);

  // Reset unread count when user is selected
  useEffect(() => {
    if (selectedUserId) {
      dispatch(resetUnreadCount({ userId: selectedUserId }));
    }
  }, [selectedUserId, dispatch]);

  // Auto-select user if coming from navigation with selectedUserId
  useEffect(() => {
    if (location.state && location.state.selectedUserId) {
      setSelectedUserId(location.state.selectedUserId);
      dispatch(setActiveChatUserId(location.state.selectedUserId));
    }
  }, [location.state, dispatch]);

  // Filter users based on search term
  const filteredUsers = connectedUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.userName?.toLowerCase().includes(searchLower) || false) ||
      (user.lastMessage?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Sort users by last message time
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    try {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    } catch (error) {
      console.error('Error sorting by date:', error);
      return 0;
    }
  });
  // Load messages when a user is selected
  return (
    <div className={`h-[100vh] flex flex-col p-2 sm:p-4 lg:p-6 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`h-full rounded-lg shadow-md ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} grid grid-cols-1 lg:grid-cols-3 relative`}>
        {/* Conversations list */}
        <div className={`border-r h-full overflow-y-auto flex-col ${selectedUserId ? 'hidden lg:flex' : 'flex'} ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`p-3 sm:p-4 lg:p-6 h-20 flex justify-center items-center border-b flex-shrink-0 ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} text-base ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spin tip="Loading Friends" size="large" indicator={<LoadingOutlined />} />
              </div>
            ) : (
              sortedUsers.map(friend => (
                <button
                  key={friend.userId}
                  onClick={() => {
                    setSelectedUserId(friend.userId)
                    dispatch(setActiveChatUserId(friend.userId))
                    console.log(selectedUserId)
                  }}
                  className={`w-full p-4 sm:p-3 lg:p-4 text-left flex items-center gap-3 ${getFontSizeClassForElement('text-base')} ${selectedUserId === friend.userId
                    ? effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    : effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    } ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                    } border-b transition-colors duration-200`}
                >
                  <Link to={`/profile/${friend.userId}`}>
                    <div className={`relative w-14 h-14 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${effectiveTheme === 'dark' ? 'ring-2 ring-gray-600' : 'ring-2 ring-gray-200'} rounded-full overflow-hidden`}>
                      <img
                        src={friend.photo_url || '/assets/avatars/avatar.png'}
                        alt={friend.userName}
                        className={`rounded-full object-cover w-full h-full mr-3 ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                      />
                      {/* Online/Offline indicator */}
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 ${effectiveTheme === 'dark' ? 'border-gray-800' : 'border-white'} ${isUserOnline(friend.userId)
                        ? getUserStatus(friend.userId) === 'idle'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : effectiveTheme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                        }`} />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-medium truncate ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? `text-${currentColor.primary}` : `text-${currentColor.primary}`}`}>
                        {friend.userName ? friend.userName : friend.userId}
                      </span>
                      {
                        friend.lastMessageTime && (
                          <span className={`text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                            {isTyping[friend.userId] ? "Typing..." :
                              formatDistanceToNow(new Date(friend.lastMessageTime), { addSuffix: true })}
                          </span>
                        )}
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm truncate ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{friend.lastMessage}</span>
                      {friend.unReadCount > 0 && (
                        <span className={`ml-2 h-6 w-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center ${getFontSizeClassForElement('text-sm')}`}>
                          {friend.unReadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`lg:col-span-2 flex flex-col relative h-full overflow-y-auto ${selectedUserId ? 'flex' : 'hidden lg:flex'}`}>
          {selectedUserId ? (
            <div className="flex-1 overflow-y-auto">
              {/* Mobile Back Button */}
              <div className={`lg:hidden p-4 border-b ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className={`flex items-center ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Conversations
                </button>
              </div>
              <Chat
                userId={selectedUserId}
                userName={selectedUser?.name || ''}
                userAvatar={selectedUser?.photo_url}
              />
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center p-4 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-center">
                <div className="text-6xl mb-6">💬</div>
                <p className={`text-xl font-medium mb-3 ${getFontSizeClassForElement('text-xl')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Select a conversation</p>
                <p className={`text-base ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Choose a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


