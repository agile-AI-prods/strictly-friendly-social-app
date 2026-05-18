import { useState } from 'react';
import { UserPlus, TrendingUp, RefreshCw, Loader2, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Tooltip } from 'antd';
import { useSuggestions } from '../hooks/useSuggestions';
import { UserSuggestionCard } from '../components/UserSuggestionCard';
import { PrivateAvatar } from '../components/PrivateAvatar';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../context/ThemeContext';
import { selectIsUserOnline, selectUserStatus } from '../store/slices/presenceSlice';

interface RightSidebarProps {
  onClose?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const RightSidebar = ({ onClose, onCollapsedChange }: RightSidebarProps) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const friendsCounts = useAppSelector(state => state.users.friendsCounts);
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const {
    suggestedUsers,
    popularUsers,
    loadingSuggested,
    loadingPopular,
    error,
    refreshSuggestions
  } = useSuggestions();

  const [activeTab, setActiveTab] = useState<'suggested' | 'popular'>('suggested');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Online status selectors
  const onlineUsers = useAppSelector((state) => state.presence.onlineUsers);
  const userStatuses = useAppSelector((state) => state.presence.userStatuses);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSuggestions();
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const getCurrentUsers = () => {
    return activeTab === 'suggested' ? suggestedUsers : popularUsers;
  };

  const getCurrentLoading = () => {
    return activeTab === 'suggested' ? loadingSuggested : loadingPopular;
  };

  const getEmptyMessage = () => {
    if (activeTab === 'suggested') {
      return 'No personalized suggestions available. Try updating your profile with more interests!';
    } else {
      return 'No popular users found at the moment.';
    }
  };

  const handleNextUser = () => {
    const users = getCurrentUsers();
    if (users.length > 0) {
      setCurrentUserIndex((prev) => (prev + 1) % users.length);
    }
  };

  const handlePrevUser = () => {
    const users = getCurrentUsers();
    if (users.length > 0) {
      setCurrentUserIndex((prev) => (prev - 1 + users.length) % users.length);
    }
  };

  const currentUsers = getCurrentUsers();
  const currentUserData = currentUsers[currentUserIndex];

  // Helper function to get online status indicator
  const getOnlineStatusIndicator = (userId: string) => {
    const isOnline = onlineUsers.includes(userId);
    const status = userStatuses[userId] || 'offline';
    
    if (!isOnline) {
      return 'bg-gray-400'; // Offline
    }
    
    switch (status) {
      case 'online':
        return 'bg-green-500'; // Online
      case 'idle':
        return 'bg-yellow-500'; // Idle
      default:
        return 'bg-gray-400'; // Offline
    }
  };

  return (
    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} h-full flex flex-col transition-all duration-300 overflow-x-hidden ${
      collapsed ? 'w-full md:w-20 lg:w-24' : 'w-full md:w-80'
    }`}>
      {/* Toggle Button */}
      <div className="w-full p-2 flex justify-center">
        <button
          onClick={toggleCollapsed}
          className={`p-2 rounded-md transition-colors ${
            effectiveTheme === 'dark'
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Content Container - Mobile: height transition, Desktop: always visible */}
      <div className={`w-full px-2 transition-all duration-300 md:max-h-full ${collapsed ? 'max-h-0 overflow-hidden' : 'max-h-screen'}`}>
        {/* Collapsed State Content */}
        <div className={`flex flex-col items-center space-y-3 px-2 flex-1 overflow-x-hidden ${collapsed ? 'md:flex' : 'hidden'}`}>
          {/* Section Title */}
          <div className="text-center w-full">
            <h4 className={`${getFontSizeClassForElement('text-xs')} font-medium truncate ${
              effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {activeTab === 'suggested' ? 'Suggested' : 'Popular'}
            </h4>
          </div>

          {/* User Avatars Stack */}
          <div className="relative w-full flex-1 overflow-x-hidden">
            {getCurrentLoading() ? (
              <div className="flex justify-center py-4">
                <Loader2 className={`h-6 w-6 animate-spin text-${currentColor.primary}`} />
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className={`${getFontSizeClassForElement('text-xs')} text-gray-500`}>
                  No users
                </p>
              </div>
            ) : (
              <>
                {/* Vertical Avatar Stack */}
                <div className="space-y-2 overflow-y-auto overflow-x-hidden h-full">
                  {currentUsers.map((user, index) => (
                    <div key={user.id} className="flex flex-col items-center">
                      <div className="relative group">
                        <PrivateAvatar
                          userId={user.id}
                          userEmail={user.email}
                          photoUrl={user.photo_url}
                          size={40}
                          alt={user.name || "User"}
                          showOnlineStatus={true}
                        />
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tab Indicator */}
          <div className="flex space-x-1 mt-2">
            <button
              onClick={() => setActiveTab('suggested')}
              className={`w-2 h-2 rounded-full transition-colors ${
                activeTab === 'suggested'
                  ? `bg-${currentColor.primary}`
                  : effectiveTheme === 'dark'
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
              }`}
            />
            <button
              onClick={() => setActiveTab('popular')}
              className={`w-2 h-2 rounded-full transition-colors ${
                activeTab === 'popular'
                  ? `bg-${currentColor.primary}`
                  : effectiveTheme === 'dark'
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Expanded State Content */}
        <div className={`w-full px-2 transition-all duration-300 flex-1 flex flex-col overflow-x-hidden ${collapsed ? 'hidden' : 'flex'}`}>
          {/* Mobile Header with Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-gray-900">Discover</h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${getFontSizeClassForElement('text-lg')} font-bold ${
                effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {activeTab === 'suggested' ? 'Suggested for You' : 'Popular People'}
              </h3>
              <Button
                type="text"
                size="small"
                icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} text-${currentColor.primary}`} />}
                onClick={handleRefresh}
                disabled={isRefreshing}
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <Tooltip title="Suggested for You">
                <button
                  onClick={() => setActiveTab('suggested')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'suggested'
                      ? effectiveTheme === 'dark'
                        ? `bg-gray-800 text-${currentColor.text} shadow-sm`
                        : `bg-white text-${currentColor.text} shadow-sm`
                      : effectiveTheme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Suggested</span>
                </button>
              </Tooltip>
              <Tooltip title="Popular People">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? effectiveTheme === 'dark'
                        ? `bg-gray-800 text-${currentColor.text} shadow-sm`
                        : `bg-white text-${currentColor.text} shadow-sm`
                      : effectiveTheme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Popular</span>
                </button>
              </Tooltip>
            </div>

            {/* Error Display */}
            {error && (
              <div className={`mb-4 p-3 border rounded-md ${
                effectiveTheme === 'dark'
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`${getFontSizeClassForElement('text-sm')} text-red-600`}>{error}</p>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4 min-w-0">
              {getCurrentLoading() ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`h-8 w-8 animate-spin text-${currentColor.primary}`} />
                </div>
              ) : getCurrentUsers().length === 0 ? (
                <div className="text-center py-8">
                  <p className={`${getFontSizeClassForElement('text-sm')} break-words text-gray-500`}>
                    {getEmptyMessage()}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 min-w-0">
                  {getCurrentUsers().map((user) => (
                    <UserSuggestionCard
                      key={user.id}
                      user={user}
                      currentUserLocation={currentUser?.location}
                      friendsCount={friendsCounts[user.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 