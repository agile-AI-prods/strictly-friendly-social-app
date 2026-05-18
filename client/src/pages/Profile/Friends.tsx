import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { UserCard } from '../../components/UserCard';
import { Button, Card, Input, Select, Spin, Tabs } from 'antd';
import { AppstoreAddOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../store/hooks';
import {
    fetchConnectedConnections,
    fetchUserConnectedConnections,
    selectConnectionStatuses,
    fetchConnectionStatuses
} from '../../store/slices/connectionSlice';
import { selectAuthUser } from '../../store/slices/authSlice';
import { Connection, Profile, ConnectionStatus } from '../../types';
import { fetchFriendsCountsForUsers, selectFriendsCounts } from '../../store/slices/userSlice';
import {
    fetchFollowers,
    fetchFollowing,
    selectFollowers,
    selectFollowing,
    selectFollowersCount,
    selectFollowingCount
} from '../../store/slices/followSlice';
import { RootState } from '../../store';

interface FriendsProps {
    userId: string;
    defaultTab?: 'friends' | 'followers' | 'following';
}

export const Friends = ({ userId: profileId, defaultTab = 'friends' }: FriendsProps) => {
    const dispatch = useAppDispatch();
    const currentUser = useSelector(selectAuthUser);

    // Redux selectors for all data
    const userConnections = useSelector((state: RootState) =>
        state.connections.userConnectionsById[profileId] || []
    );
    const followers = useSelector(selectFollowers(profileId));
    const following = useSelector(selectFollowing(profileId));
    const followersCount = useSelector(selectFollowersCount(profileId));
    const followingCount = useSelector(selectFollowingCount(profileId));
    const friendsCounts = useSelector(selectFriendsCounts);
    const friendsConnectionStatuses = useSelector(selectConnectionStatuses);

    // Local state
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
    const [activeTab, setActiveTab] = useState<'friends' | 'followers' | 'following'>(defaultTab);
    const [loading, setLoading] = useState(false);
    const [followersLoading, setFollowersLoading] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [followersConnectionStatus, setFollowersConnectionStatus] = useState<Record<string, ConnectionStatus | null>>({});
    const [followingConnectionStatus, setFollowingConnectionStatus] = useState<Record<string, ConnectionStatus | null>>({});

    // Debounced search handler
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    // Set active tab when defaultTab changes
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    // Show loading spinner when profileId changes
    useEffect(() => {
        setLoading(true);
    }, [profileId]);

    // Fetch friends for the viewed user
    useEffect(() => {
        if (!profileId) return;
        setLoading(true);
        dispatch(fetchUserConnectedConnections(profileId)).then(() => {
            setLoading(false);
        });
    }, [dispatch, profileId]);

    // Fetch current user's connections if viewing self
    useEffect(() => {
        if (profileId === currentUser?.id) {
            dispatch(fetchConnectedConnections());
        }
    }, [dispatch, profileId, currentUser]);

    // Fetch followers/following lists when tab or user changes
    useEffect(() => {
        if (!profileId) return;

        if (activeTab === 'followers') {
            setFollowersLoading(true);
            dispatch(fetchFollowers(profileId)).then(() => {
                setFollowersLoading(false);
            });
        } else if (activeTab === 'following') {
            setFollowingLoading(true);
            dispatch(fetchFollowing(profileId)).then(() => {
                setFollowingLoading(false);
            });
        }
    }, [profileId, activeTab, dispatch]);

    // Fetch connection statuses for followers/following
    useEffect(() => {
        const fetchStatuses = async () => {
            if (!currentUser) return;

            try {
                if (activeTab === 'followers' && followers.length > 0) {
                    const userIds = followers.map(u => u.id).filter(id => id && id.trim() !== ''); // Filter out any undefined/null/empty IDs
                    console.log('Fetching followers connection statuses for userIds:', userIds);
                    if (userIds.length > 0) {
                        const result = await dispatch(fetchConnectionStatuses(userIds)).unwrap();
                        setFollowersConnectionStatus(result);
                    }
                } else if (activeTab === 'following' && following.length > 0) {
                    const userIds = following.map(u => u.id).filter(id => id && id.trim() !== ''); // Filter out any undefined/null/empty IDs
                    console.log('Fetching following connection statuses for userIds:', userIds);
                    if (userIds.length > 0) {
                        const result = await dispatch(fetchConnectionStatuses(userIds)).unwrap();
                        setFollowingConnectionStatus(result);
                    }
                }
            } catch (error) {
                console.error('Error fetching connection statuses:', error);
            }
        };

        // Only run if we have a current user and we're on a relevant tab with actual data
        const hasFollowers = activeTab === 'followers' && followers.length > 0;
        const hasFollowing = activeTab === 'following' && following.length > 0;

        if (currentUser && (hasFollowers || hasFollowing)) {
            fetchStatuses();
        }
    }, [currentUser, activeTab, followers, following, dispatch]);

    // Filter and sort users (for all tabs)
    const filterAndSortUsers = (users: Profile[]): Profile[] => {
        let filtered = users.filter((user: Profile) => {
            const search = searchTerm.toLowerCase();
            const matchesName = user.name?.toLowerCase().includes(search);
            const matchesBio = user.bio?.toLowerCase().includes(search);
            const matchesCity = user.location?.city?.toLowerCase().includes(search);
            const matchesInterests = user.interests?.some((i: { label: string }) =>
                i.label.toLowerCase().includes(search)
            );
            const matchesAge = user.age?.toString().includes(search);
            return (
                matchesName ||
                matchesBio ||
                matchesCity ||
                matchesInterests ||
                matchesAge
            );
        });

        if (sortBy === 'name') {
            filtered = filtered.sort((a: Profile, b: Profile) => a.name.localeCompare(b.name));
        } else if (sortBy === 'date') {
            filtered = filtered.sort((a: Profile, b: Profile) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }
        return filtered;
    };

    // Get friend from connection (the other user in the connection)
    const getFriend = (connection: Connection): Profile => {
        if (!profileId) throw new Error('No profileId');
        return connection.sender.id === profileId ? connection.receiver : connection.sender;
    };

    // Memoize base data to prevent unnecessary re-renders
    const memoizedUserConnections = useMemo(() => userConnections, [userConnections]);
    const memoizedFollowers = useMemo(() => followers, [followers]);
    const memoizedFollowing = useMemo(() => following, [following]);

    // Process friends from connections
    const allFriends = useMemo(() => {
        return memoizedUserConnections
            .map((conn: Connection) => getFriend(conn))
            .filter((friend: Profile) => friend.id !== profileId);
    }, [memoizedUserConnections, profileId]);

    // Deduplicate by id
    const uniqueFriends = useMemo(() => {
        return allFriends.filter((friend: Profile, idx: number, arr: Profile[]) =>
            arr.findIndex((f: Profile) => f.id === friend.id) === idx
        );
    }, [allFriends]);

    // Filter and sort friends
    const filteredFriends = useMemo(() => {
        return filterAndSortUsers(uniqueFriends);
    }, [uniqueFriends, searchTerm, sortBy]);

    // Process followers/following data
    const filteredFollowers = useMemo(() => {
        return filterAndSortUsers(
            memoizedFollowers.map((item: any) => ({
                id: item.follower.id,
                name: item.follower.name,
                photo_url: item.follower.photo_url,
                created_at: item.created_at,
                updated_at: item.created_at,
                email: '',
                interests: [],
            }))
        );
    }, [memoizedFollowers, searchTerm, sortBy]);

    const filteredFollowing = useMemo(() => {
        return filterAndSortUsers(
            memoizedFollowing.map((item: any) => ({
                id: item.followed.id,
                name: item.followed.name,
                photo_url: item.followed.photo_url,
                created_at: item.created_at,
                updated_at: item.created_at,
                email: '',
                interests: [],
            }))
        );
    }, [memoizedFollowing, searchTerm, sortBy]);

    // Memoize user IDs for counts - only update when the actual user lists change
    const userIdsForCounts = useMemo(() => {
        const allUserIds = [
            ...filteredFriends.map(u => u.id),
            ...filteredFollowers.map(u => u.id),
            ...filteredFollowing.map(u => u.id)
        ];
        return Array.from(new Set(allUserIds));
    }, [filteredFriends, filteredFollowers, filteredFollowing]);

    // Fetch friends count for all users in the current tab
    useEffect(() => {
        if (userIdsForCounts.length > 0) {
            // Only fetch if we don't already have the counts for these users
            const missingUserIds = userIdsForCounts.filter(userId =>
                !(userId in friendsCounts)
            );

            if (missingUserIds.length > 0) {
                dispatch(fetchFriendsCountsForUsers(missingUserIds));
            }
        }
    }, [userIdsForCounts, dispatch, friendsCounts]);

    // Render functions
    const renderFriendsGrid = () => (
        <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {filteredFriends.map((friend: Profile) => (
                <div key={friend.id} className="space-y-4">
                    <UserCard
                        key={friend.id}
                        senderId={currentUser?.id || ''}
                        receiverId={friend.id}
                        user={friend}
                        friendsCount={friendsCounts[friend.id]}
                    />
                </div>
            ))}
        </div>
    );

    const renderFriendsList = () => (
        <div className="space-y-4">

            {filteredFriends.map((friend: Profile) => (
                <div key={friend.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={friend.photo_url || 'https://randomuser.me/api/portraits/men/1.jpg'}
                            alt={friend.name}
                            className="w-16 h-16 rounded-full border-4 border-white object-cover"
                        />
                        <div>
                            <h3 className="text-lg font-semibold">{friend.name}</h3>
                            <p className="text-gray-500 text-sm">{friend.location?.city}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            type="primary"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => { }}
                        >
                            Message
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFollowersGrid = () => (
        <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {filteredFollowers.map((user: Profile) => (
                <div key={user.id} className="space-y-4">
                    <UserCard
                        key={user.id}
                        senderId={currentUser?.id || ''}
                        receiverId={user.id}
                        user={user}
                        friendsCount={friendsCounts[user.id]}
                    />
                </div>
            ))}
        </div>
    );

    const renderFollowersList = () => (
        <div className="space-y-4">
            {filteredFollowers.map((user: Profile) => (
                <div key={user.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user.photo_url || 'https://randomuser.me/api/portraits/men/1.jpg'}
                            alt={user.name}
                            className="w-16 h-16 rounded-full border-4 border-white object-cover"
                        />
                        <div>
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <p className="text-gray-500 text-sm">{user.location?.city}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            type="primary"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => { }}
                        >
                            Message
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFollowingGrid = () => (
        <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>            {filteredFollowing.map((user: Profile) => (
            <div key={user.id} className="space-y-4">
                <UserCard
                    key={user.id}
                    senderId={currentUser?.id || ''}
                    receiverId={user.id}
                    user={user}
                    friendsCount={friendsCounts[user.id]}
                />
            </div>
        ))}
        </div>
    );

    const renderFollowingList = () => (
        <div className="space-y-4">
            {filteredFollowing.map((user: Profile) => (
                <div key={user.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user.photo_url || 'https://randomuser.me/api/portraits/men/1.jpg'}
                            alt={user.name}
                            className="w-16 h-16 rounded-full border-4 border-white object-cover"
                        />
                        <div>
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <p className="text-gray-500 text-sm">{user.location?.city}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            type="primary"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => { }}
                        >
                            Message
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );

    // Show loading spinner if loading is true
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Card>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Friends</h1>
                <div className="flex flex-wrap gap-4 mb-6 items-center">
                    <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="w-48"
                        allowClear
                    />
                    <Select
                        value={sortBy}
                        onChange={v => setSortBy(v)}
                        className="w-36"
                        options={[
                            { value: 'name', label: 'Sort by Name' },
                            { value: 'date', label: 'Sort by Date' },
                        ]}
                    />
                    <div className="berserk-toggle h-8 sm:h-[40px] ml-2">
                        <div className="berserk-toggle-background" data-active={view} />
                        <Button
                            type="text"
                            icon={<UnorderedListOutlined />}
                            onClick={() => setView('list')}
                            className={`berserk-btn ${view === 'list' ? 'active' : ''}`}
                        />
                        <Button
                            type="text"
                            icon={<AppstoreAddOutlined />}
                            onClick={() => setView('grid')}
                            className={`berserk-btn ${view === 'grid' ? 'active' : ''}`}
                        />
                    </div>
                </div>
                <Tabs
                    activeKey={activeTab}
                    onChange={key => setActiveTab(key as 'friends' | 'followers' | 'following')}
                    items={[
                        {
                            key: 'friends',
                            label: `Friends (${filteredFriends.length})`,
                            children: view === 'grid' ? renderFriendsGrid() : renderFriendsList(),
                        },
                        {
                            key: 'followers',
                            label: `Followers (${followersCount})`,
                            children: followersLoading ? (
                                <div className="flex justify-center py-8"><Spin size="large" /></div>
                            ) : view === 'grid' ? renderFollowersGrid() : renderFollowersList(),
                        },
                        {
                            key: 'following',
                            label: `Following (${followingCount})`,
                            children: followingLoading ? (
                                <div className="flex justify-center py-8"><Spin size="large" /></div>
                            ) : view === 'grid' ? renderFollowingGrid() : renderFollowingList(),
                        },
                    ]}
                />
            </div>
        </Card>
    );
}; 