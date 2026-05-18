import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { UserCard } from '../../components/UserCard';
import { Tabs, Button, Avatar, Select, Input } from 'antd';
import { AppstoreAddOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { MessageCircle } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { selectAuthUser } from '../../store/slices/authSlice';
import { Profile } from '../../types';
import { calculateDistance } from '../../utils/location';
import { useNavigate } from 'react-router-dom';
import { fetchFriendsCountsForUsers, selectFriendsCounts } from '../../store/slices/userSlice';
import { useTheme } from '../../context/ThemeContext';
import { fetchFriends, selectFriends, selectFriendStatuses } from '../../store/slices/friendSlice';

export const Friends = () => {
  const dispatch = useAppDispatch();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const friends = useSelector(selectFriends) as Profile[];
  const currentUser = useSelector(selectAuthUser);
  const friendsCounts = useSelector(selectFriendsCounts);
  const friendStatuses = useSelector(selectFriendStatuses);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  // Fetch friends count for all users in friends list
  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(friends.filter(Boolean).map(u => u.id)));
    if (uniqueUserIds.length > 0) {
      dispatch(fetchFriendsCountsForUsers(uniqueUserIds));
    }
  }, [friends, dispatch]);

  const filterAndSort = (users: Profile[]) => {
    let filtered = users;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.location?.city?.toLowerCase().includes(searchLower) ||
        user.interests?.some(interest =>
          interest.label.toLowerCase().includes(searchLower)
        )
      );
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
      filtered.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return filtered;
  };

  const renderFriends = (friendsList: Profile[]) => {
    const filteredFriends = filterAndSort(friendsList);

    if (view === 'grid') {
      return (
        <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {filteredFriends.map((friend) => {
            let distance = friend?.location ? calculateDistance(
              friend.location.latitude,
              friend.location.longitude,
              currentUser?.location?.latitude || 0,
              currentUser?.location?.longitude || 0
            ) : 0;
            return (
              <div key={friend.id} className="space-y-4">
                <UserCard
                  senderId={currentUser?.id || ''}
                  receiverId={friend.id}
                  user={friend}
                  distance={distance}
                  unit="km"
                  friendsCount={friendsCounts[friend.id]}
                  showMessageButton={true}
                  showFriendButton={false}
                  isFriend={true}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-4 w-full">
        {filteredFriends.map(friend => {
          let distance = friend?.location ? calculateDistance(
            friend.location.latitude,
            friend.location.longitude,
            currentUser?.location?.latitude || 0,
            currentUser?.location?.longitude || 0
          ) : 0;
          return (
            <div key={friend.id} className={`rounded-lg shadow p-3 sm:p-4 w-full ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Avatar
                    src={friend.photo_url || "https://randomuser.me/api/portraits/men/1.jpg"}
                    size={48}
                    className={`border-2 ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-white'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base sm:text-lg font-semibold truncate ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {friend.name}
                    </h3>
                    <p className={`text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {distance.toFixed(1)}km away
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
                  <Button
                    type="primary"
                    className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white px-4 py-2 rounded-lg text-sm font-medium`}
                    onClick={() => navigate('/messages', { state: { selectedUserId: friend.id } })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen pb-16 md:pb-0 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="w-full min-h-screen">
          <h1 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${getFontSizeClassForElement('text-xl')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            My Friends
          </h1>

          {/* Mobile-Optimized Filters */}
          <div className={`rounded-lg flex gap-4 flex-col md:flex-row justify-center items-center shadow-md p-4 sm:p-6 mb-4 sm:mb-6 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>

            {/* Search Bar */}
            <Input
              placeholder="Search friends by name, location, interests..."
              value={searchTerm}
              prefix={<SearchOutlined />}
              size='large'
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
            />

            {/* Sort Filter */}
            <div className="sm:col-span-1">
              <Select
                value={sortBy}
                size='large'
                onChange={(value) => setSortBy(value as 'name' | 'date')}
                placeholder="Sort by"
                className="w-full"
                options={[
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'date', label: 'Sort by Date' }
                ]}
              />
            </div>
            <div className="custom-controls h-10 min-w-16">
              <div className={`berserk-toggle h-full ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div
                  className={`berserk-toggle-background ${effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}
                  data-active={view}
                />
                <Button
                  type="text"
                  icon={<UnorderedListOutlined />}
                  onClick={() => setView("list")}
                  style={{ width: '100%', height: '100%' }}
                  className={`berserk-btn ${view === "list" ? "active" : ""} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                />
                <Button
                  type="text"
                  icon={<AppstoreAddOutlined />}
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => setView("grid")}
                  className={`berserk-btn ${view === "grid" ? "active" : ""} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                />
              </div>
            </div>

          </div>

          {/* Friends Content */}
          {friends.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                No friends yet. Start adding friends from the Discover page!
              </p>
            </div>
          ) : (
            renderFriends(friends)
          )}

          {/* Friends Count */}
          {friends.length > 0 && (
            <div className={`text-center mt-4 text-sm ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="block sm:inline">Showing {friends.length} friends</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 