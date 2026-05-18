import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, MessageCircle, UserPlus } from 'lucide-react';
import { RootState } from '../../store';
import { UserCard } from '../../components/UserCard';
import { calculateDistance } from '../../utils/location';
import { Dropdown } from '../../components/Dropdown';
import { MultiSelectDropdown } from '../../components/MultiSelectDropdown';
import { Avatar, Button, Input, Tooltip } from 'antd';
import { AppstoreAddOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchFilteredProfiles, setFilterParams, selectFilteredUsers, resetPagination, selectHasMore, selectCurrentPage, fetchFriendsCountsForUsers, selectFriendsCounts } from '../../store/slices/userSlice';
import { useTheme } from '../../context/ThemeContext';
import { addUserToConnectedUsers } from '../../store/slices/messageSlice';

import { useGeolocation } from '../../hooks/useGeolocation';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
// Utility to detect if user prefers miles (US, UK, etc.)
function prefersMiles(countryCode: string) {
  // US, UK, Liberia, Myanmar use miles
  return ['US', 'GB', 'LR', 'MM'].includes(countryCode);
}

// Example: get country code from browser (fallback to 'US')
function getCountryCode() {
  // You can use a geolocation API for more accuracy
  if (navigator.language) {
    const code = navigator.language.split('-')[1];
    return code ? code.toUpperCase() : 'US';
  }
  return 'US';
}

const countryCode = getCountryCode();
const useMiles = prefersMiles(countryCode);

const DISTANCE_OPTIONS = useMiles
  ? [
    { value: 3, label: 'Within 3 mi' },
    { value: 6, label: 'Within 6 mi' },
    { value: 15, label: 'Within 15 mi' },
    { value: 30, label: 'Within 30 mi' },
    { value: 60, label: 'Within 60 mi' },
    { value: 'any', label: 'Any distance' }
  ]
  : [
    { value: 5, label: 'Within 5 km' },
    { value: 10, label: 'Within 10 km' },
    { value: 25, label: 'Within 25 km' },
    { value: 50, label: 'Within 50 km' },
    { value: 100, label: 'Within 100 km' },
    { value: 'any', label: 'Any distance' }
  ];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Sort by Distance' },
  { value: 'name', label: 'Sort by Name' },
  { value: 'age', label: 'Sort by Age' }
];

const interestCategories = {
  'Arts & Culture': ['Museums', 'Theater', 'Photography', 'Painting', 'Music', 'Dance', 'Film', 'Concerts'],
  'Sports & Fitness': ['Gym', 'Running', 'Yoga', 'Hiking', 'Swimming', 'Tennis', 'Basketball', 'Soccer', 'Cycling'],
  'Outdoor Activities': ['Camping', 'Fishing', 'Picnics', 'Gardening', 'Birdwatching', 'Kayaking', 'Beach'],
  'Gaming': ['Video Games', 'Board Games', 'eSports', 'Card Games', 'Tabletop RPG', 'Puzzles'],
  'Food & Drink': ['Coffee shops', 'Cooking', 'Wine tasting', 'Breweries', 'Baking', 'Restaurants', 'Food Trucks'],
  'Reading & Writing': ['Book Clubs', 'Poetry', 'Journaling', 'Fiction', 'Non-fiction', 'Comics'],
  'Tech & Gadgets': ['Coding', 'Robotics', 'AR/VR', 'Startups', 'AI', 'Smart Home'],
  'Volunteering': ['Animal shelters', 'Community service', 'Environmental', 'Teaching', 'Mentoring'],
  'Travel': ['Local exploring', 'Road trips', 'International travel', 'Backpacking', 'Cruises', 'Cultural exchange'],
  'Learning': ['Language exchange', 'Online courses', 'Skill sharing', 'Workshops', 'DIY Projects']
};

// Flatten the interest categories for the dropdown
const allInterests = Object.values(interestCategories).flat().map(interest => ({
  value: interest,
  label: interest
}));

export const Discover = () => {
  const dispatch = useAppDispatch();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const currentUser = useAppSelector((state: RootState) => state.auth.user);
  const filteredUsers = useAppSelector(selectFilteredUsers);
  const loading = useAppSelector((state: RootState) => state.users.loading === 'pending');
  const userFetchError = useAppSelector((state: RootState) => state.users.error);
  const hasMore = useAppSelector(selectHasMore);
  const currentPage = useAppSelector(selectCurrentPage);
  const friendsCounts = useAppSelector(selectFriendsCounts);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<number | 'any'>(useMiles ? 15 : 25);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'age'>('distance');
  const [view, setView] = useState("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);

  const handleAddFriend = (userId: string) => {
    setHiddenUserIds(prev => [...prev, userId]);
  };

  const { city } = useGeolocation();
  const navigate = useNavigate();

  const isLoadingMoreRef = useRef(false);

  // Update filter params for Redux filtering and reset pagination
  useEffect(() => {
    console.log('Selected interests:', selectedInterests);
    if (currentUser?.id) {
      dispatch(resetPagination());

      // Scroll to top when filters change
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Convert selectedDistance to km if using miles
      const maxDistanceKm =
        selectedDistance !== 'any'
          ? useMiles
            ? Number(selectedDistance) * 1.60934
            : Number(selectedDistance)
          : undefined;
      const params = {
        currentUserId: currentUser.id,
        searchTerm: searchTerm || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        maxDistance: maxDistanceKm,
        currentUserLocation: currentUser.location,
        page: 1,
        append: false
      };

      dispatch(setFilterParams(params));
      dispatch(fetchFilteredProfiles(params));
    }
  }, [dispatch, searchTerm, selectedInterests, selectedDistance]);

  // Handle load more functionality
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      if (currentUser?.id) {
        const nextPage = currentPage + 1;
        // Convert selectedDistance to km if using miles
        const maxDistanceKm =
          selectedDistance !== 'any'
            ? useMiles
              ? Number(selectedDistance) * 1.60934
              : Number(selectedDistance)
            : undefined;
        const params = {
          currentUserId: currentUser.id,
          searchTerm: searchTerm || undefined,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
          maxDistance: maxDistanceKm,
          currentUserLocation: currentUser.location,
          page: nextPage,
          append: true
        };

        await dispatch(fetchFilteredProfiles(params));
      }
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, currentUser?.id, currentPage, selectedDistance, searchTerm, selectedInterests, dispatch]);

  // Auto-load more when scrolling to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMoreRef.current || !hasMore) return;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 100) {
        handleLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, handleLoadMore]);

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (!currentUser?.location) return 0;
        let distanceA = calculateDistance(
          currentUser.location.latitude,
          currentUser.location.longitude,
          a.location?.latitude || 0,
          a.location?.longitude || 0
        );
        let distanceB = calculateDistance(
          currentUser.location.latitude,
          currentUser.location.longitude,
          b.location?.latitude || 0,
          b.location?.longitude || 0
        );
        if (useMiles) {
          distanceA *= 0.621371;
          distanceB *= 0.621371;
        }
        return distanceA - distanceB;

      case 'name':
        return a.name.localeCompare(b.name);

      case 'age':
        return (a.age || 0) - (b.age || 0);

      default:
        return 0;
    }
  });

  // Debug logging
  console.log('🔍 Discover Page Debug Info:', {
    filteredUsersLength: filteredUsers.length,
    filteredUsers: filteredUsers,
    sortedUsersLength: sortedUsers.length,
    sortedUsers: sortedUsers,
    currentUser: currentUser,
    loading: loading,
    hasMore: hasMore,
    currentPage: currentPage,
    userFetchError: userFetchError
  });

  return (
    <div className={`min-h-screen pb-16 md:pb-0 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="w-full min-h-screen">
          <h1 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${getFontSizeClassForElement('text-xl')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Discover New Friends</h1>
          
          {/* Mobile-Optimized Filters */}
          <div className={`rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
            
            {/* Search Bar - Full Width on Mobile */}
            <div className="mb-4">
              <div className="relative">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search by name, interests, location..."
                  value={searchTerm}
                  size="large"
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className={`w-full  pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
              {searchTerm && (
                <p className="mt-1 text-xs text-gray-500">
                  Search across names, bios, interests, locations, and activities
                </p>
              )}
            </div>

            {/* Filters Grid - Responsive Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* View Toggle - Mobile Optimized */}
              <div className="custom-controls h-10 min-w-16 order-first sm:order-none">
                <div className={`berserk-toggle h-full ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                  <div
                    className={`berserk-toggle-background ${effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-white'
                      }`}
                    data-active={view}
                  />
                  <Button
                    type="text"
                    icon={<UnorderedListOutlined />}
                    onClick={() => setView("list")}
                    style={{ width: '100%', height: '100%' }}
                    className={`berserk-btn ${view === "list" ? "active" : ""} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'
                      }`}
                  />
                  <Button
                    type="text"
                    icon={<AppstoreAddOutlined />}
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => setView("grid")}
                    className={`berserk-btn ${view === "grid" ? "active" : ""} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'
                      }`}
                  />
                </div>
              </div>

              {/* Interest Filter */}
              <div className="sm:col-span-1">
                <MultiSelectDropdown
                  options={allInterests}
                  selectedValues={selectedInterests}
                  onChange={setSelectedInterests}
                  placeholder="Filter by interests"
                  className="w-full"
                />
              </div>

              {/* Distance Filter */}
              <div className="sm:col-span-1">
                <Dropdown
                  options={DISTANCE_OPTIONS}
                  value={selectedDistance}
                  onChange={(value) => setSelectedDistance(value === 'any' ? 'any' : Number(value))}
                  placeholder="Select distance"
                  className="w-full"
                />
              </div>

              {/* Sort Filter */}
              <div className="sm:col-span-1">
                <Dropdown
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as 'distance' | 'name' | 'age')}
                  placeholder="Sort by"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Content */}
          {view === "grid" ? (
            <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
              {sortedUsers.filter(friend => !hiddenUserIds.includes(friend.id)).map((friend) => {
                let distance = friend?.location ? calculateDistance(
                  friend.location.latitude,
                  friend.location.longitude,
                  currentUser?.location?.latitude || 0,
                  currentUser?.location?.longitude || 0
                ) : 0;
                if (useMiles) distance *= 0.621371;
                return (
                  <div key={friend.id} className="w-full min-w-0">
                    <UserCard
                      senderId={currentUser?.id || ''}
                      receiverId={friend.id}
                      user={friend}
                      distance={distance}
                      unit={useMiles ? 'mi' : 'km'}
                      onAddFriend={() => handleAddFriend(friend.id)}
                      friendsCount={friendsCounts[friend.id] || 0}
                      showMessageButton={true}
                      showFriendButton={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full">
              {sortedUsers.filter(profile => !hiddenUserIds.includes(profile.id)).map(profile => {
                let distance = profile?.location ? calculateDistance(
                  profile.location.latitude,
                  profile.location.longitude,
                  currentUser?.location?.latitude || 0,
                  currentUser?.location?.longitude || 0
                ) : 0;
                if (useMiles) distance *= 0.621371;
                return (
                  <div key={profile.id} className={`rounded-lg shadow p-3 sm:p-4 w-full ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Avatar
                          src={profile.photo_url || "https://randomuser.me/api/portraits/men/1.jpg"}
                          size={48}
                          className={`border-2 ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-white'
                            }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-semibold truncate ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{profile.name}</h3>
                          <p className={`text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>{distance.toFixed(1)}{useMiles ? 'mi' : 'km'} away</p>
                        </div>
                      </div>

                      {/* Friends Avatars - Mobile Optimized */}
                      {profile.friends_avatars && profile.friends_avatars.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1 sm:-space-x-2">
                            {profile.friends_avatars.slice(0, 3).map(friend => (
                              <Avatar
                                key={friend.id}
                                src={friend.photo_url}
                                size={24}
                                alt={friend.name}
                                className={`border-2 ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-white'
                                  }`}
                              />
                            ))}
                          </div>
                          {profile.friends_count && profile.friends_count > 3 && (
                            <span className={`text-xs ${getFontSizeClassForElement('text-xs')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>+{profile.friends_count - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
                        <Button
                          type="primary"
                          icon={<MessageCircle className="h-4 w-4 mr-1" />}
                          className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white px-4 py-2 rounded-lg text-sm font-medium`}
                          onClick={() => {
                            dispatch(addUserToConnectedUsers({
                              userId: profile.id,
                              userName: profile.name,
                              photo_url: profile.photo_url
                            }));
                            navigate('/messages', { state: { selectedUserId: profile.id } });
                          }}
                        >
                          Message
                        </Button>
                        <Button
                          type="primary"
                          icon={<UserPlus className="h-4 w-4 mr-1" />}
                          className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium`}
                          onClick={() => handleAddFriend(profile.id)}
                        >
                          Add Friend
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Info - Mobile Optimized */}
          {sortedUsers.length > 0 && (
            <div className={`text-center mt-4 text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
              <span className="block sm:inline">Showing {sortedUsers.length} users</span>
              {hasMore && <span className="block sm:inline sm:ml-2">• Page {currentPage}</span>}
            </div>
          )}

          {/* Loading States - Mobile Optimized */}
          {loading && sortedUsers.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-${currentColor.primary}`}></div>
                <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>Loading new friends...</p>
              </div>
            </div>
          )}

          {isLoadingMore && sortedUsers.length > 0 && (
            <div className="text-center py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-${currentColor.primary}`}></div>
                <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>Loading more users...</p>
              </div>
            </div>
          )}

          {sortedUsers.length === 0 && !loading && !isLoadingMore && (
            <div className="text-center py-8 sm:py-12">
              <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>No new friends found matching your criteria.</p>
            </div>
          )}

          {userFetchError && (
            <div className="text-center py-8 sm:py-12 text-red-500">
              <p className={getFontSizeClassForElement('text-base')}>Error loading users: {userFetchError}</p>
            </div>
          )}

          {/* Location Info - Mobile Optimized */}
          <div className={`mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <MapPin className={`h-4 w-4 mr-1 text-${currentColor.primary} mb-1 sm:mb-0`} />
            <span className="text-center sm:text-left">
              {currentUser?.location
                ? `Showing people near ${currentUser.location.latitude.toFixed(2)}, ${currentUser.location.longitude.toFixed(2)}`
                : 'Location not available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
