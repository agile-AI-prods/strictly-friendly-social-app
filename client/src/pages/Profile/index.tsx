import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { likeItem, unlikeItem, fetchLikesCount, selectLikeStatus } from '../../store/slices/likeSlice';
import { Spin } from 'antd';
import { Edit } from 'lucide-react';
import { Snackbar } from '../../components/Snackbar';
import { selectUserConnectionStatus, sendConnectionRequest, fetchConnectionStatuses } from '../../store/slices/connectionSlice';
import { Friends } from './Friends';
import { EditProfile } from './EditProfile';
import { profileService } from '../../services/profileService';
import { updateProfile, fetchProfileById, selectProfileLoading } from '../../store/slices/userSlice';
import { updateUser } from '../../store/slices/authSlice';
import { followUser, unfollowUser, fetchFollowingCount, fetchFollowersCount, selectFollowStatus, checkIsFollowing } from '../../store/slices/followSlice';
import { useAppDispatch } from '../../store/hooks';
import { checkFollowMeStatus } from '../../api/settingsApi';
import { fetchFriendsCountsForUsers, selectFriendsCounts } from '../../store/slices/userSlice';
import { useTheme } from '../../context/ThemeContext';
import { shouldShowBirthday } from '../../utils/birthdayPrivacy';
import { shouldShowBio } from '../../utils/bioPrivacy';
import { shouldShowEmail } from '../../utils/emailPrivacy';

export const ProfilePage = () => {
  // All hooks must be at the top, before any return
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const { userId } = useParams(); // use userId from params
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => userId ? state.users.profileById[userId] : undefined);
  const profileLoading = useSelector(selectProfileLoading(userId || ''));
  const connectionStatus = useSelector(selectUserConnectionStatus(profile?.id || ''));
  
  // Get like status and count from Redux
  const likeStatus = useSelector(selectLikeStatus(profile?.id || '', 'profile'));
  const likeCount = useSelector((state: RootState) => 
    state.likes.counts[profile?.id || '']?.['profile'] || 0
  );
  
  // Get follow status and counts from Redux
  const isFollowing = useSelector(selectFollowStatus(profile?.id || ''));
  const followersCount = useSelector((state: RootState) => 
    state.follows.followersCounts[profile?.id || ''] || 0
  );
  const followingCount = useSelector((state: RootState) => 
    state.follows.followingCounts[profile?.id || ''] || 0
  );
  
  // Get friends count from Redux
  const friendsCount = useSelector((state: RootState) => 
    state.users.friendsCounts[profile?.id || ''] || 0
  );

  // Fetch followers and following counts
  useEffect(() => {
    if (userId) {
      dispatch(fetchFollowersCount(userId));
      dispatch(fetchFollowingCount(userId));
    }
  }, [userId, dispatch]);

  // Check follow status when profile loads
  useEffect(() => {
    if (profile?.id && user?.id && profile.id !== user.id) {
      dispatch(checkIsFollowing(profile.id));
    }
  }, [profile?.id, user?.id, dispatch]);

  // Fetch friends count when profile loads
  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchFriendsCountsForUsers([profile.id]));
    }
  }, [profile?.id, dispatch]);

  // Fetch connection status when profile loads
  useEffect(() => {
    if (profile?.id && user?.id && profile.id !== user.id) {
      dispatch(fetchConnectionStatuses([profile.id]));
    }
  }, [profile?.id, user?.id, dispatch]);

  // All useState hooks
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [canFollow, setCanFollow] = useState(true);
  const [followMeLoading, setFollowMeLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'About' | 'Friends'>('About');
  const [activeFriendsSubTab, setActiveFriendsSubTab] = useState<'friends' | 'followers' | 'following'>('friends');
  const [showBirthday, setShowBirthday] = useState(false);
  const [birthdayLoading, setBirthdayLoading] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const subtab = params.get('subtab');
    if (tab === 'Friends') setActiveTab('Friends');
    if (subtab === 'followers' || subtab === 'friends' || subtab === 'following') setActiveFriendsSubTab(subtab as any);
  }, [location.search]);

  // All useEffect hooks
  useEffect(() => {
    if (userId) {
      console.log('fetchProfileById is called')
      dispatch(fetchProfileById(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (profile?.id) {
      setLikeLoading(true);
      // Fetch like count from Redux
      dispatch(fetchLikesCount({ targetId: profile.id, targetType: 'profile' }));
      setLikeLoading(false);
    }
  }, [profile?.id, dispatch]);

  // Check if target user allows following
  useEffect(() => {
    const checkFollowPermission = async () => {
      if (!profile?.email || profile.id === user?.id) {
        setCanFollow(true);
        return;
      }

      setFollowMeLoading(true);
      try {
        const result = await checkFollowMeStatus(profile.email);
        const allowsFollowing = result?.data?.follow_me === 'true';
        setCanFollow(allowsFollowing);
      } catch (error) {
        console.error('Failed to check follow_me status:', error);
        setCanFollow(true); // Default to allow on error
      } finally {
        setFollowMeLoading(false);
      }
    };

    checkFollowPermission();
  }, [profile?.email, profile?.id, user?.id]);

  // Check birthday visibility permission
  useEffect(() => {
    const checkBirthdayVisibility = async () => {
      if (!profile?.email || !profile?.id) {
        setShowBirthday(false);
        return;
      }

      setBirthdayLoading(true);
      try {
        console.log('Checking birthday visibility:', {
          profileEmail: profile.email,
          currentUserId: user?.id,
          targetUserId: profile.id,
          connectionStatus,
          profileBirthday: profile.birthday
        });
        
        const canShowBirthday = await shouldShowBirthday(
          profile.email,
          user?.id,
          profile.id,
          connectionStatus || undefined
        );
        
        console.log('Birthday visibility result:', canShowBirthday);
        setShowBirthday(canShowBirthday);
      } catch (error) {
        console.error('Failed to check birthday visibility:', error);
        setShowBirthday(false);
      } finally {
        setBirthdayLoading(false);
      }
    };

    checkBirthdayVisibility();
  }, [profile?.email, profile?.id, user?.id, connectionStatus]);

  // Check bio visibility permission
  useEffect(() => {
    const checkBioVisibility = async () => {
      if (!profile?.email || !profile?.id) {
        setShowBio(false);
        return;
      }

      setBioLoading(true);
      try {
        console.log('Checking bio visibility:', {
          profileEmail: profile.email,
          currentUserId: user?.id,
          targetUserId: profile.id,
          connectionStatus,
          profileBio: profile.bio
        });
        
        const canShowBio = await shouldShowBio(
          profile.email,
          user?.id,
          profile.id,
          connectionStatus || undefined
        );
        
        console.log('Bio visibility result:', canShowBio);
        setShowBio(canShowBio);
      } catch (error) {
        console.error('Failed to check bio visibility:', error);
        setShowBio(false);
      } finally {
        setBioLoading(false);
      }
    };

    checkBioVisibility();
  }, [profile?.email, profile?.id, user?.id, connectionStatus]);

  // Check email visibility permission
  useEffect(() => {
    const checkEmailVisibility = async () => {
      if (!profile?.email || !profile?.id) {
        setShowEmail(false);
        return;
      }

      setEmailLoading(true);
      try {
        console.log('Checking email visibility:', {
          profileEmail: profile.email,
          currentUserId: user?.id,
          targetUserId: profile.id,
          connectionStatus
        });
        
        const canShowEmail = await shouldShowEmail(
          profile.email,
          user?.id,
          profile.id,
          connectionStatus || undefined
        );
        
        console.log('Email visibility result:', canShowEmail);
        setShowEmail(canShowEmail);
      } catch (error) {
        console.error('Failed to check email visibility:', error);
        setShowEmail(false);
      } finally {
        setEmailLoading(false);
      }
    };

    checkEmailVisibility();
  }, [profile?.email, profile?.id, user?.id, connectionStatus]);

  // Show loading spinner if user is not loaded, profile is loading, or profile is not loaded
  if (!user || profileLoading || !profile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
        <Spin size="large" tip="Loading profile..." />
      </div>
    );
  }

  // Only return early after all hooks
  if (!user || !profile) return null;

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setTempData(profile);
    setHasChanges(false);
  };

  // --- Action Button Handlers ---
  const handleFollow = async () => {
    if (!profile?.id || !user?.id || profile.id === user.id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(profile.id)).unwrap();
      } else {
        await dispatch(followUser(profile.id)).unwrap();
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!profile?.id) return;
    setLikeLoading(true);
    try {
      if (likeStatus) { // Use likeStatus from Redux
        await dispatch(unlikeItem({ targetId: profile.id, targetType: 'profile' })).unwrap();
      } else {
        await dispatch(likeItem({ targetId: profile.id, targetType: 'profile' })).unwrap();
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setLikeLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!profile?.id || !user?.id || profile.id === user.id) return;
    setConnectLoading(true);
    try {
      await dispatch(sendConnectionRequest(profile.id)).unwrap();
      // Optionally show a toast or update state
    } catch (e) {
      // Optionally show error
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className={`container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        {user.id === profile.id && isEditMode ? (
          <EditProfile
            initialValues={profile}
            onSave={async (values) => {
              setIsLoading(true);
              setError(null);
              try {
                await dispatch(updateProfile({ userId: user.id, profileData: values })).unwrap();
                setSuccess('Profile updated!');
                setIsEditMode(false);
                dispatch(fetchProfileById(user.id));
                // Update auth user as well
                dispatch(updateUser({
                  ...user,
                  ...values,
                  photo_url: values.photo_url,
                  name: values.name,
                  age: values.age,
                  bio: values.bio,
                  interests: values.interests,
                  location: values.location,
                  updated_at: new Date().toISOString(),
                }));
              } catch (e: any) {
                setError(e.message || 'Failed to update profile');
              } finally {
                setIsLoading(false);
              }
            }}
            onCancel={() => setIsEditMode(false)}
          />
        ) : (
          <>
            {/* Profile Header Panel */}
            <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
              {/* Cover Image Header */}
              <div className="relative h-48 sm:h-64">
                <img
                  src={'cover_url' in profile && (profile as any).cover_url ? (profile as any).cover_url : `https://picsum.photos/400/200?random=${profile.id}`}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                {/* Action Buttons */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 flex space-x-2 sm:space-x-3 z-10">
                  {/* Follow or Unfollow Button */}
                  {user.id !== profile.id && canFollow && !isFollowing && (
                    <button
                      className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center`}
                      title="Follow"
                      onClick={handleFollow}
                      disabled={followLoading || followMeLoading}
                    >
                      <i className="fas fa-user-plus text-sm sm:text-base" style={{ opacity: (followLoading || followMeLoading) ? 0.5 : 1 }} />
                      {(followLoading || followMeLoading) && <span className="ml-1 sm:ml-2 animate-spin text-xs sm:text-sm">⏳</span>}
                    </button>
                  )}
                  {user.id !== profile.id && canFollow && isFollowing && (
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center"
                      title="Unfollow"
                      onClick={handleFollow}
                      disabled={followLoading || followMeLoading}
                    >
                      <i className="fas fa-user-minus text-sm sm:text-base" style={{ opacity: (followLoading || followMeLoading) ? 0.5 : 1 }} />
                      {(followLoading || followMeLoading) && <span className="ml-1 sm:ml-2 animate-spin text-xs sm:text-sm">⏳</span>}
                    </button>
                  )}
                  {/* Like Button */}
                  <button
                    className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center ${likeStatus ? `ring-2 ring-${currentColor.primary}` : ''}`}
                    title={likeStatus ? 'Unlike' : 'Like'}
                    onClick={handleLike}
                    disabled={likeLoading}
                  >
                    <i className="fas fa-heart text-sm sm:text-base" style={{ color: likeStatus ? '#ffeb3b' : 'white', opacity: likeLoading ? 0.5 : 1 }} />
                    {likeLoading && <span className="ml-1 sm:ml-2 animate-spin text-xs sm:text-sm">⏳</span>}
                  </button>
                  <span className="text-white font-bold self-center select-none text-sm sm:text-base" style={{ textShadow: '0 1px 4px #0008' }}>{likeCount > 0 ? likeCount : ''}</span>
                  {/* Message, Pending, or Connect Button */}
                  {user.id !== profile.id && connectionStatus === 'accepted' && (
                    <button
                      className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center`}
                      title="Message"
                      onClick={() => navigate(`/messages/${profile.id}`)}
                    >
                      <i className="fas fa-comment text-sm sm:text-base" />
                    </button>
                  )}
                  {user.id !== profile.id && connectionStatus === 'pending' && (
                    <button
                      className="bg-gray-400 text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center cursor-not-allowed"
                      title="Pending"
                      disabled
                    >
                      <i className="fas fa-hourglass-half text-sm sm:text-base" />
                    </button>
                  )}
                  {user.id !== profile.id && (!connectionStatus || connectionStatus === 'rejected') && (
                    <button
                      className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded-full p-2 sm:p-3 shadow-lg flex items-center justify-center`}
                      title="Connect"
                      onClick={handleConnect}
                      disabled={connectLoading}
                    >
                      <i className="fas fa-user-plus text-sm sm:text-base" style={{ opacity: connectLoading ? 0.5 : 1 }} />
                      {connectLoading && <span className="ml-1 sm:ml-2 animate-spin text-xs sm:text-sm">⏳</span>}
                    </button>
                  )}
                </div>

                {/* Avatar */}
                <div className="absolute left-4 sm:left-8 bottom-4 sm:bottom-8 transform z-10">
                  <img
                    src={profile.photo_url || 'https://randomuser.me/api/portraits/men/1.jpg'}
                    alt={profile.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                </div>
              </div>

              {/* User Info and Stats */}
              <div className={`flex flex-col lg:flex-row items-start lg:items-end justify-between px-4 sm:px-8 pt-4 sm:pt-8 pb-4 space-y-4 lg:space-y-0 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-full lg:w-auto">
                  <div className="flex items-center space-x-2">
                    <h1 className={`${getFontSizeClassForElement('text-lg sm:text-xl md:text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile.name}</h1>
                    {user.id === profile.id && isEditMode && (
                      <button
                        onClick={() => handleEdit('name')}
                        className={`text-${currentColor.primary} hover:text-${currentColor.hover}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className={`${getFontSizeClassForElement('text-sm sm:text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{profile.location ? profile.location.city ? profile.location.city : `${profile.location.latitude.toFixed(2)}, ${profile.location.longitude.toFixed(2)}` : 'Location'}</p>
                </div>
                
                {/* Custom Tabs */}
                <div className="w-full lg:w-auto">
                  <nav className="flex justify-center space-x-2 sm:space-x-4 lg:space-x-8">
                    {['About', 'Friends'].map(tab => (
                      <button
                        key={tab}
                        className={`py-2 sm:py-3 lg:py-4 px-2 sm:px-4 ${getFontSizeClassForElement('text-sm sm:text-base')} font-medium ${activeTab === tab
                          ? `text-${currentColor.primary} border-b-2 border-${currentColor.primary}`
                          : `${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-${currentColor.primary}`
                          }`}
                        onClick={() => setActiveTab(tab as 'About' | 'Friends')}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Stats Section */}
                <div className="flex justify-center lg:justify-end space-x-4 sm:space-x-6 lg:space-x-8 text-center w-full lg:w-auto">
                  <div 
                    className="cursor-pointer flex-1 lg:flex-none" 
                    onClick={() => {
                      setActiveTab('Friends');
                      setActiveFriendsSubTab('friends');
                    }}
                  >
                    <div className={`${getFontSizeClassForElement('text-xs sm:text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Friends</div>
                    <div className={`${getFontSizeClassForElement('text-base sm:text-lg')} font-bold text-${currentColor.primary}`}>{friendsCount}</div>
                  </div>
                  <div 
                    className="cursor-pointer flex-1 lg:flex-none" 
                    onClick={() => {
                      setActiveTab('Friends');
                      setActiveFriendsSubTab('followers');
                    }}
                  >
                    <div className={`${getFontSizeClassForElement('text-xs sm:text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Followers</div>
                    <div className={`${getFontSizeClassForElement('text-base sm:text-lg')} font-bold text-${currentColor.primary}`}>{followersCount}</div>
                  </div>
                  <div 
                    className="cursor-pointer flex-1 lg:flex-none" 
                    onClick={() => {
                      setActiveTab('Friends');
                      setActiveFriendsSubTab('following');
                    }}
                  >
                    <div className={`${getFontSizeClassForElement('text-xs sm:text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Following</div>
                    <div className={`${getFontSizeClassForElement('text-base sm:text-lg')} font-bold text-${currentColor.primary}`}>{followingCount}</div>
                  </div>
                </div>
                
                {/* Edit Button */}
                <div className="flex items-center justify-center lg:justify-end w-full lg:w-auto">
                  {user.id === profile.id && !isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`px-3 sm:px-4 py-2 bg-${currentColor.primary} text-white rounded-lg hover:bg-${currentColor.hover} transition-colors !rounded-button whitespace-nowrap cursor-pointer ${getFontSizeClassForElement('text-sm sm:text-base')}`}
                    >
                      <i className="fas fa-edit mr-1 sm:mr-2"></i> Edit Profile
                    </button>
                  )}
                  {user.id === profile.id && isEditMode && (
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors !rounded-button whitespace-nowrap cursor-pointer ${getFontSizeClassForElement('text-sm sm:text-base')}`}
                    >
                      <i className="fas fa-check mr-1 sm:mr-2"></i> Done
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Tab Panels */}
            <div className="mt-6 sm:mt-8">
              {activeTab === 'About' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* About Me Card */}
                  <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                      <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>About Me</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2">
                      <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Name:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.name}</span></div>
                      {profile.pronouns && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pronouns:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.pronouns}</span></div>}
                      {profile.email && showEmail && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Email:</span><span className={`${getFontSizeClassForElement('text-sm')} text-${currentColor.primary} underline`}>{profile.email}</span></div>}
                      {profile.age && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Age:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.age}</span></div>}
                      {profile.birthday && showBirthday && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Birthday:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{new Date(profile.birthday).toLocaleDateString()}</span></div>}
                      {profile.location?.city && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Location:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.location.city}</span></div>}
                      {profile.location && !profile.location.city && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Location:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.location.latitude}, {profile.location.longitude}</span></div>}
                      {profile.created_at && <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-32 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Joined:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{new Date(profile.created_at).toLocaleDateString()}</span></div>}
                    </div>
                    {profile.bio && showBio && (
                      <div className="mt-4">
                        <span className={`block font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Bio:</span>
                        <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.bio}</span>
                      </div>
                    )}

                  </div>

                  {/* Interests Card */}
                  <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                      <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Interests</h2>
                    </div>
                    <div className="mb-2">
                      <span className={`block font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Interests:</span>
                      <div className="flex flex-wrap gap-2">
                        {(profile.interests && profile.interests.length > 0)
                          ? profile.interests.map(i => (
                            <span key={i.id} className={`bg-${currentColor.light} text-${currentColor.text} px-3 py-1 rounded-full ${getFontSizeClassForElement('text-sm')}`}>{i.label}</span>
                          ))
                          : <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>—</span>
                        }
                      </div>
                    </div>
                    {profile.reason_for_joining && (
                      <div className="mt-2">
                        <span className={`block font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Reason for Joining:</span>
                        <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.reason_for_joining}</span>
                      </div>
                    )}
                  </div>

                  {/* Preferences Card */}
                  {profile.social_preferences && (
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                        <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Preferences</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2">
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Looking For:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.social_preferences.looking_for) ? profile.social_preferences.looking_for.join(', ') : profile.social_preferences.looking_for || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Relationship Type:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.social_preferences.relationship_type) ? profile.social_preferences.relationship_type.join(', ') : profile.social_preferences.relationship_type || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Communication Style:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.social_preferences.communicationStyle) ? profile.social_preferences.communicationStyle.join(', ') : profile.social_preferences.communicationStyle || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Social Setting:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.social_preferences.socialSetting || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Preferred Times:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.social_preferences.times) ? profile.social_preferences.times.join(', ') : profile.social_preferences.times || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Availability:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.social_preferences.availability || '—'}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Lifestyle Card */}
                  {profile.lifestyle && (
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                        <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Lifestyle</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2">
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Hobbies:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.lifestyle.hobbies) ? profile.lifestyle.hobbies.join(', ') : profile.lifestyle.hobbies || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Activities:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.lifestyle.activities) ? profile.lifestyle.activities.join(', ') : profile.lifestyle.activities || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Schedule:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{profile.lifestyle.schedule || '—'}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Boundaries Card */}
                  {profile.boundaries && (
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                        <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Boundaries</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2">
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Dealbreakers:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.boundaries.dealbreakers) ? profile.boundaries.dealbreakers.join(', ') : profile.boundaries.dealbreakers || '—'}</span></div>
                        <div className="flex flex-col sm:flex-row"><span className={`w-full sm:w-40 font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Preferences:</span><span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{Array.isArray(profile.boundaries.preferences) ? profile.boundaries.preferences.join(', ') : profile.boundaries.preferences || '—'}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Lightning Round Card */}
                  {profile.lightning_round && profile.lightning_round.questions && profile.lightning_round.questions.length > 0 && (
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4 sm:p-6`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-1.5 h-6 bg-${currentColor.primary} rounded mr-3`} />
                        <h2 className={`${getFontSizeClassForElement('text-lg sm:text-xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Lightning Round</h2>
                      </div>
                      <div className="space-y-2">
                        {profile.lightning_round.questions.map((q, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-4">
                            <span className={`font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} md:w-1/3`}>{q.question}</span>
                            <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} md:w-2/3`}>{q.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'Friends' && (
                <Friends userId={profile.id} defaultTab={activeFriendsSubTab} />
              )}
            </div>
          </>
        )}
        {/* Followers/Following Modals */}
        {error && (
          <Snackbar
            message={error || ''}
            variant="error"
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Snackbar
            message={success || ''}
            variant="success"
            onClose={() => setSuccess('')}
          />
        )}
      </div>
    </div>
  );
};
