import { useState, useEffect, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchProfileById, fetchFriendsCountsForUsers } from '../../store/slices/userSlice';
import { fetchFollowersCount, fetchFollowingCount } from '../../store/slices/followSlice';
import { useAppDispatch } from '../../store/hooks';
import { Snackbar } from '../../components/Snackbar';
import { updateEmail, updatePassword } from '../../api/profileApi';
import { getProfileByCurrentUserEmail, updateProfileByCurrentUserEmail } from '../../api/profileApi';
import { saveUserSettings, updateUserSettings, saveGeneralSettings, updateGeneralSettings, getUserSettings } from '../../api/settingsApi';
import { Bell, Lock, Shield, User, Settings as SettingsIcon, Edit, MessageSquare, Cloud, Palette, Eye, Smartphone, Zap, Trash2, Heart, Mail, Phone, Ban, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DeviceManagement } from '../DeviceManagement';

export const Settings = () => {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => user?.id ? state.users.profileById[user.id] : undefined);
  const friendsCount = useSelector((state: RootState) => 
    state.users.friendsCounts[user?.id || ''] || 0
  );
  const followersCount = useSelector((state: RootState) => 
    state.follows.followersCounts[user?.id || ''] || 0
  );
  const followingCount = useSelector((state: RootState) => 
    state.follows.followingCounts[user?.id || ''] || 0
  );
  
  const [activeTab, setActiveTab] = useState('general');
  const [showDeviceManagement, setShowDeviceManagement] = useState(false);
  const [settings, setSettings] = useState({
    subUsers: false,
    enableFollowMe: false,
    profilePhotos: 'everybody',
    sendNotifications: false,
    textMessages: false,
    enableTagging: false,
    enableSoundNotification: true,
    activityNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    loginAlerts: true,
    birth: 'contacts',
    bio: 'contacts',
    email_setting: 'contacts'
  });

  // Use global theme context
  const { themeSettings, setThemeSettings, effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();



  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordSuccessMessage, setShowPasswordSuccessMessage] = useState(false);

  // Profile data state for Settings Edit Profile
  const [settingsProfileData, setSettingsProfileData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    country: '',
    region: '',
    zip: '',
    company: '',
    language: '',
    Timezone: ''
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');



  const handleToggle = async (key: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...settings,
      [key]: !settings[key as keyof typeof settings]
    };

    // Update UI immediately
    setSettings(newSettings);

    // Save to database in background for specific settings
    if (key === 'enableFollowMe') {
      (async () => {
        try {
          // Always try to update first, if it fails, create new
          try {
            await updateGeneralSettings(user.email!, { follow_me: newSettings.enableFollowMe ? 'true' : 'false' });
          } catch (error: any) {
            if (error.response?.status === 404) {
              // User doesn't exist, so create new entry
              await saveGeneralSettings(user.email!, { follow_me: newSettings.enableFollowMe ? 'true' : 'false' });
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Failed to save follow me setting:', error);
          // Revert UI changes on error
          setSettings(settings);
          alert('Failed to save follow me setting. Please try again.');
        }
      })();
    } else if (key === 'activityNotifications') {
      (async () => {
        try {
          // Always try to update first, if it fails, create new
          try {
            await updateGeneralSettings(user.email!, { activity_notifications: newSettings.activityNotifications ? 'true' : 'false' });
          } catch (error: any) {
            if (error.response?.status === 404) {
              // User doesn't exist, so create new entry
              await saveGeneralSettings(user.email!, { activity_notifications: newSettings.activityNotifications ? 'true' : 'false' });
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Failed to save activity notifications setting:', error);
          // Revert UI changes on error
          setSettings(settings);
          alert('Failed to save activity notifications setting. Please try again.');
        }
      })();
    } else if (key === 'commentNotifications') {
      (async () => {
        try {
          // Always try to update first, if it fails, create new
          try {
            await updateGeneralSettings(user.email!, { comment_notifications: newSettings.commentNotifications ? 'true' : 'false' });
          } catch (error: any) {
            if (error.response?.status === 404) {
              // User doesn't exist, so create new entry
              await saveGeneralSettings(user.email!, { comment_notifications: newSettings.commentNotifications ? 'true' : 'false' });
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Failed to save comment notifications setting:', error);
          // Revert UI changes on error
          setSettings(settings);
          alert('Failed to save comment notifications setting. Please try again.');
        }
      })();
    } else if (key === 'likeNotifications') {
      (async () => {
        try {
          // Always try to update first, if it fails, create new
          try {
            await updateGeneralSettings(user.email!, { like_notifications: newSettings.likeNotifications ? 'true' : 'false' });
          } catch (error: any) {
            if (error.response?.status === 404) {
              // User doesn't exist, so create new entry
              await saveGeneralSettings(user.email!, { like_notifications: newSettings.likeNotifications ? 'true' : 'false' });
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Failed to save like notifications setting:', error);
          // Revert UI changes on error
          setSettings(settings);
          alert('Failed to save like notifications setting. Please try again.');
        }
      })();
    } else if (key === 'loginAlerts') {
      (async () => {
        try {
          // Always try to update first, if it fails, create new
          try {
            await updateGeneralSettings(user.email!, { login_alerts: newSettings.loginAlerts ? 'true' : 'false' });
          } catch (error: any) {
            if (error.response?.status === 404) {
              // User doesn't exist, so create new entry
              await saveGeneralSettings(user.email!, { login_alerts: newSettings.loginAlerts ? 'true' : 'false' });
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Failed to save login alerts setting:', error);
          // Revert UI changes on error
          setSettings(settings);
          alert('Failed to save login alerts setting. Please try again.');
        }
      })();
    }
  };

  const handleProfilePhotosChange = async (value: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...settings,
      profilePhotos: value
    };

    // Update UI immediately
    setSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateGeneralSettings(user.email!, { profile_photos: value });
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveGeneralSettings(user.email!, { profile_photos: value });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save profile photos setting:', error);
        // Revert UI changes on error
        setSettings(settings);
        alert('Failed to save profile photos setting. Please try again.');
      }
    })();
  };

  const handleBirthChange = async (value: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...settings,
      birth: value
    };

    // Update UI immediately
    setSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateGeneralSettings(user.email!, { birth: value });
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveGeneralSettings(user.email!, { birth: value });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save birth privacy setting:', error);
        // Revert UI changes on error
        setSettings(settings);
        alert('Failed to save birth privacy setting. Please try again.');
      }
    })();
  };

  const handleBioChange = async (value: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...settings,
      bio: value
    };

    // Update UI immediately
    setSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateGeneralSettings(user.email!, { bio: value });
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveGeneralSettings(user.email!, { bio: value });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save bio privacy setting:', error);
        // Revert UI changes on error
        setSettings(settings);
        alert('Failed to save bio privacy setting. Please try again.');
      }
    })();
  };

  const handleEmailChange = async (value: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...settings,
      email_setting: value
    };

    // Update UI immediately
    setSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateGeneralSettings(user.email!, { email_setting: value });
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveGeneralSettings(user.email!, { email_setting: value });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save email privacy setting:', error);
        // Revert UI changes on error
        setSettings(settings);
        alert('Failed to save email privacy setting. Please try again.');
      }
    })();
  };

  const handleThemeToggle = async (key: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...themeSettings,
      [key]: key === 'autoTheme' ? !themeSettings.autoTheme : !themeSettings[key as keyof typeof themeSettings]
    };

    // Update UI immediately
    setThemeSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateUserSettings(user.email!, newSettings);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveUserSettings(user.email!, newSettings);
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save theme settings:', error);
        // Revert UI changes on error
        setThemeSettings(themeSettings);
        alert('Failed to save theme settings. Please try again.');
      }
    })();
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...themeSettings,
      theme: theme
    };

    // Update UI immediately
    setThemeSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateUserSettings(user.email!, newSettings);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveUserSettings(user.email!, newSettings);
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save theme settings:', error);
        // Revert UI changes on error
        setThemeSettings(themeSettings);
        alert('Failed to save theme settings. Please try again.');
      }
    })();
  };

  const handlePrimaryColorChange = async (color: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...themeSettings,
      primaryColor: color
    };

    // Update UI immediately
    setThemeSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateUserSettings(user.email!, newSettings);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveUserSettings(user.email!, newSettings);
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save theme settings:', error);
        // Revert UI changes on error
        setThemeSettings(themeSettings);
        alert('Failed to save theme settings. Please try again.');
      }
    })();
  };

  const handleFontSizeChange = async (size: string) => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    const newSettings = {
      ...themeSettings,
      fontSize: size
    };

    // Update UI immediately
    setThemeSettings(newSettings);

    // Save to database in background
    (async () => {
      try {
        // Always try to update first, if it fails, create new
        try {
          await updateUserSettings(user.email!, newSettings);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // User doesn't exist, so create new entry
            await saveUserSettings(user.email!, newSettings);
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Failed to save theme settings:', error);
        // Revert UI changes on error
        setThemeSettings(themeSettings);
        alert('Failed to save theme settings. Please try again.');
      }
    })();
  };

  const getFontSizeClass = () => {
    switch (themeSettings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      case 'extra-large':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };



  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
  };



  // Save profile function for Settings Edit Profile
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSaveMessage('');
    
    try {
      const updatedProfile = await updateProfileByCurrentUserEmail(settingsProfileData);
      console.log('Profile saved successfully:', updatedProfile);
      setProfileSaveMessage('Profile saved successfully!');
      
      // Reload profile data to show updated information
      await loadProfileByEmail();
      
      setTimeout(() => setProfileSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setProfileSaveMessage(error.response?.data?.error || error.message || 'Failed to save profile');
      setTimeout(() => setProfileSaveMessage(''), 5000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Email update functions
  const handleOpenEmailModal = () => {
    setNewEmail('');
    setCurrentPassword('');
    setEmailError('');
    setIsEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setNewEmail('');
    setCurrentPassword('');
    setEmailError('');
  };

  // Password modal functions
  const handleOpenPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordForChange('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordForChange('');
    setPasswordError('');
  };



  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isEmailModalOpen || isPasswordModalOpen)) {
        if (isEmailModalOpen) {
          handleCloseEmailModal();
        }
        if (isPasswordModalOpen) {
          handleClosePasswordModal();
        }
      }
    };

    if (isEmailModalOpen || isPasswordModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isEmailModalOpen, isPasswordModalOpen]);

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) {
      setEmailError('Please fill in all fields');
      return;
    }

    if (!newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsUpdatingEmail(true);
    setEmailError('');

    try {
      // Use server endpoint to update email
      const response = await updateEmail(newEmail, currentPassword);
      
      // Success - close modal and show success message
      handleCloseEmailModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
    } catch (error: any) {
      setEmailError(error.response?.data?.error || error.message || 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPasswordForChange) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError('');

    try {
      // Use server endpoint to update password
      const response = await updatePassword(newPassword, currentPasswordForChange);
      
      // Success - close modal and show success message
      handleClosePasswordModal();
      setShowPasswordSuccessMessage(true);
      setTimeout(() => setShowPasswordSuccessMessage(false), 5000);
      
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };



  // Fetch profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchProfileById(user.id));
      dispatch(fetchFollowersCount(user.id));
      dispatch(fetchFollowingCount(user.id));
      dispatch(fetchFriendsCountsForUsers([user.id]));
    }
  }, [user?.id, dispatch]);

  // Load profile data by current user email for Settings Edit Profile
  const loadProfileByEmail = async () => {
    if (!user?.email) return;
    
    setIsLoadingProfile(true);
    try {
      const profileData = await getProfileByCurrentUserEmail();
      console.log('Profile data loaded by email:', profileData);
      
      setSettingsProfileData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || '',
        region: profileData.region || '',
        zip: profileData.zip || '',
        company: profileData.company || '',
        language: profileData.language || '',
        Timezone: profileData.Timezone || ''
      });
    } catch (error) {
      console.error('Failed to load profile by email:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load profile data when Edit Profile tab is selected
  useEffect(() => {
    if (activeTab === 'profile' && user?.email) {
      loadProfileByEmail();
    }
  }, [activeTab, user?.email]);

  // Load general settings when component mounts
  useEffect(() => {
    const loadGeneralSettings = async () => {
      if (!user?.email) return;
      
      try {
        const userSettings = await getUserSettings(user.email);
        
        if (userSettings?.data?.general_settings) {
          const generalSettings = userSettings.data.general_settings;
          
          setSettings(prev => ({
            ...prev,
            enableFollowMe: generalSettings.follow_me === 'true',
            profilePhotos: generalSettings.profile_photos || 'everybody',
            birth: generalSettings.birth || 'contacts',
            bio: generalSettings.bio || 'contacts',
            email_setting: generalSettings.email_setting || 'contacts',
            activityNotifications: generalSettings.activity_notifications !== 'false',
            commentNotifications: generalSettings.comment_notifications !== 'false',
            likeNotifications: generalSettings.like_notifications !== 'false',
            loginAlerts: generalSettings.login_alerts !== 'false'
          }));
        }
      } catch (error) {
        console.error('Failed to load general settings:', error);
      }
    };

    loadGeneralSettings();
  }, [user?.email]);

  const sidebarItems = [
    { id: 'general', label: 'General Setting', icon: SettingsIcon },
    { id: 'profile', label: 'Edit Profile', icon: Edit },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'theme', label: 'Theme Setting', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
    // { id: 'account', label: 'Account Changes', icon: Trash2 }
  ];

  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} ${getFontSizeClass()}`}>
            {/* Header/Banner Section */}
      <div className="relative h-64">
        <img
          src={`https://picsum.photos/400/200?random=${user?.id || '1'}`}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Avatar */}
        <div className="absolute left-20 bottom-8 transform z-10">
          <img
            src={user?.photo_url || 'https://randomuser.me/api/portraits/men/1.jpg'}
            alt={user?.name || 'Profile'}
            className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
          />
        </div>

      </div>

      {/* User Info and Stats */}
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between px-8 pt-8 pb-4">
            <div className="flex items-center space-x-8">
              <div className="text-center min-w-[200px]">
                <h1 className={`${getFontSizeClassForElement('text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile?.name || user?.name || ''}</h1>
                <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {profile?.location ? 
                    (profile.location.city ? 
                      profile.location.city : 
                      `${profile.location.latitude?.toFixed(2)}, ${profile.location.longitude?.toFixed(2)}`
                    ) : 
                    ''
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-8 text-center">
              <div>
                                  <div className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Friends</div>
                                  <div className={`font-bold ${getFontSizeClassForElement('text-lg')} text-${currentColor.text}`}>{friendsCount}</div>
              </div>
              <div>
                                  <div className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Followers</div>
                                  <div className={`font-bold ${getFontSizeClassForElement('text-lg')} text-${currentColor.text}`}>{followersCount}</div>
              </div>
              <div>
                                  <div className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Following</div>
                                  <div className={`font-bold ${getFontSizeClassForElement('text-lg')} text-${currentColor.text}`}>{followingCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
              <div className="p-4">
                <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold mb-4 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h3>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3 py-2 ${getFontSizeClassForElement('text-sm')} font-medium rounded-md transition-colors duration-200 ${
                          activeTab === item.id
                            ? `bg-${currentColor.light} text-${currentColor.text}`
                            : effectiveTheme === 'dark' 
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
              <div className="p-6">
                <h2 className={`${getFontSizeClassForElement('text-2xl')} font-bold mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {activeTab === 'general' && 'General Setting'}
                  {activeTab === 'profile' && 'Edit Profile'}
                  {activeTab === 'notification' && 'Notification'}
                  {activeTab === 'theme' && 'Theme Setting'}
                  {activeTab === 'privacy' && 'Privacy & Data'}
                  {activeTab === 'security' && 'Security'}

                  {activeTab === 'account' && 'Account Changes'}
                </h2>
                <p className={`${getFontSizeClassForElement('text-base')} mb-6 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {activeTab === 'general' && 'Set your login preference, help us personalize your experience and make big account change here.'}
                  {activeTab === 'profile' && 'Update your personal information and profile details.'}
                  {activeTab === 'notification' && 'Manage your notification preferences.'}
                  {activeTab === 'theme' && 'Customize your app appearance and theme settings.'}
                  {activeTab === 'privacy' && 'Manage your privacy and data settings.'}
                  {activeTab === 'security' && 'Configure your security settings.'}

                  {activeTab === 'account' && 'Manage your account status and make important account changes.'}
                </p>

                <div className="space-y-6">
                  {activeTab === 'general' && (
                    <>

                      {/* Enable Follow Me */}
                      <div className={`flex items-center justify-between p-4 border rounded-lg ${
                        effectiveTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
                      }`}>
                        <div>
                          <h3 className={`${getFontSizeClassForElement('text-base')} font-medium ${
                            effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Enable Follow Me</h3>
                          <p className={`${getFontSizeClassForElement('text-sm')} ${
                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>Enable this if you want people to follow you</p>
                        </div>
                        <button
                          onClick={() => handleToggle('enableFollowMe')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.enableFollowMe ? `bg-${currentColor.primary}` : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              settings.enableFollowMe ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Send Me Notifications */}
                      {/* <div className={`flex items-center justify-between p-4 border rounded-lg ${
                        effectiveTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
                      }`}>
                        <div>
                          <h3 className={`${getFontSizeClassForElement('text-base')} font-medium ${
                            effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Send Me Notifications</h3>
                          <p className={`${getFontSizeClassForElement('text-sm')} ${
                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>Send me notification emails my friends like, share or message me</p>
                        </div>
                        <button
                          onClick={() => handleToggle('sendNotifications')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.sendNotifications ? `bg-${currentColor.primary}` : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              settings.sendNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div> */}

                      {/* Text Messages */}
                      {/* <div className={`flex items-center justify-between p-4 border rounded-lg ${
                        effectiveTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
                      }`}>
                        <div>
                          <h3 className={`${getFontSizeClassForElement('text-base')} font-medium ${
                            effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Text Messages</h3>
                          <p className={`${getFontSizeClassForElement('text-sm')} ${
                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>Send me messages to my cell phone</p>
                        </div>
                        <button
                          onClick={() => handleToggle('textMessages')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.textMessages ? `bg-${currentColor.primary}` : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              settings.textMessages ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div> */}

                      {/* Enable Tagging */}
                      {/* <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Enable Tagging</h3>
                          <p className="text-sm text-gray-500">Enable my friends to tag me on their posts</p>
                        </div>
                        <button
                          onClick={() => handleToggle('enableTagging')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.enableTagging ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              settings.enableTagging ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div> */}

                      {/* Enable Sound Notification */}
                      <div className={`flex items-center justify-between p-4 border rounded-lg ${
                        effectiveTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
                      }`}>
                        <div>
                          <h3 className={`${getFontSizeClassForElement('text-base')} font-medium ${
                            effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Enable Sound Notification</h3>
                          <p className={`${getFontSizeClassForElement('text-sm')} ${
                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>You'll hear notification sound when someone sends you a private message</p>
                        </div>
                        <button
                          onClick={() => handleToggle('enableSoundNotification')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.enableSoundNotification ? `bg-${currentColor.primary}` : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              settings.enableSoundNotification ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Save button for General tab */}
                      
                    </>
                  )}

                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      {isLoadingProfile ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                          <span className="ml-2 text-gray-600">Loading profile data...</span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>First Name</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your first name"
                                value={settingsProfileData.first_name}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Last Name</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your last name"
                                value={settingsProfileData.last_name}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Address</label>
                            <input
                              type="text"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                effectiveTheme === 'dark' 
                                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="Enter your address"
                              value={settingsProfileData.address}
                              onChange={(e) => setSettingsProfileData(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>City/Town</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your city or town"
                                value={settingsProfileData.city}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, city: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Country</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your country"
                                value={settingsProfileData.country}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, country: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Region/State</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your region or state"
                                value={settingsProfileData.region}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, region: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Zip Code</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your zip code"
                                value={settingsProfileData.zip}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, zip: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Company</label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter your company name"
                                value={settingsProfileData.company}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, company: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Language</label>
                              <select 
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white' 
                                    : 'border-gray-300'
                                }`}
                                value={settingsProfileData.language}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, language: e.target.value }))}
                              >
                                <option value="">Select your preferred language</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="ru">Russian</option>
                                <option value="ja">Japanese</option>
                                <option value="zh">Chinese</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Timezone</label>
                                                          <select 
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                                  effectiveTheme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-white' 
                                    : 'border-gray-300'
                                }`}
                                value={settingsProfileData.Timezone}
                                onChange={(e) => setSettingsProfileData(prev => ({ ...prev, Timezone: e.target.value }))}
                              >
                              <option value="">Select your timezone</option>
                              <option value="UTC-12">UTC-12 (Baker Island)</option>
                              <option value="UTC-11">UTC-11 (Samoa)</option>
                              <option value="UTC-10">UTC-10 (Hawaii)</option>
                              <option value="UTC-9">UTC-9 (Alaska)</option>
                              <option value="UTC-8">UTC-8 (Pacific Time)</option>
                              <option value="UTC-7">UTC-7 (Mountain Time)</option>
                              <option value="UTC-6">UTC-6 (Central Time)</option>
                              <option value="UTC-5">UTC-5 (Eastern Time)</option>
                              <option value="UTC-4">UTC-4 (Atlantic Time)</option>
                              <option value="UTC-3">UTC-3 (Brazil)</option>
                              <option value="UTC-2">UTC-2 (South Georgia)</option>
                              <option value="UTC-1">UTC-1 (Azores)</option>
                              <option value="UTC+0">UTC+0 (London)</option>
                              <option value="UTC+1">UTC+1 (Paris)</option>
                              <option value="UTC+2">UTC+2 (Cairo)</option>
                              <option value="UTC+3">UTC+3 (Moscow)</option>
                              <option value="UTC+4">UTC+4 (Dubai)</option>
                              <option value="UTC+5">UTC+5 (Tashkent)</option>
                              <option value="UTC+6">UTC+6 (Dhaka)</option>
                              <option value="UTC+7">UTC+7 (Bangkok)</option>
                              <option value="UTC+8">UTC+8 (Beijing)</option>
                              <option value="UTC+9">UTC+9 (Tokyo)</option>
                              <option value="UTC+10">UTC+10 (Sydney)</option>
                              <option value="UTC+11">UTC+11 (Solomon Islands)</option>
                              <option value="UTC+12">UTC+12 (New Zealand)</option>
                            </select>
                          </div>

                          {/* Save button and message */}
                          <div className="flex items-center justify-between pt-6">
                            <div className="flex-1">
                              {profileSaveMessage && (
                                <div className={`text-sm ${profileSaveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                                  {profileSaveMessage}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleSaveProfile}
                              disabled={isSavingProfile}
                              className={`px-6 py-2 bg-${currentColor.primary} text-white rounded-md hover:bg-${currentColor.hover} disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center`}
                            >
                              {isSavingProfile ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Save Profile
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <Mail className={`mr-3 h-5 w-5 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <div>
                              <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Login Mail</h4>
                              <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Manage your login email preferences</p>
                            </div>
                          </div>
                          <button className={`px-4 py-2 bg-${currentColor.primary} text-white rounded-md hover:bg-${currentColor.hover} transition-colors duration-200`} onClick={handleOpenEmailModal}>
                            Configure
                          </button>
                        </div>

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <Phone className={`mr-3 h-5 w-5 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <div>
                              <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Phone Number</h4>
                              <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Manage your phone number for account recovery</p>
                            </div>
                          </div>
                          <button className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                            Update
                          </button>
                        </div> */}

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <Ban className={`mr-3 h-5 w-5 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <div>
                              <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Block User</h4>
                              <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Manage blocked users and privacy settings</p>
                            </div>
                          </div>
                          <button className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                            Manage
                          </button>
                        </div> */}

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Two-Factor Authentication</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Add an extra layer of security to your account</p>
                          </div>
                          <button className={`px-4 py-2 bg-${currentColor.primary} text-white rounded-md hover:bg-${currentColor.hover} transition-colors duration-200`}>
                            Enable
                          </button>
                        </div> */}

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Change Password</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Update your account password</p>
                          </div>
                          <button 
                            className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                              effectiveTheme === 'dark' 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={handleOpenPasswordModal}
                          >
                            Change
                          </button>
                        </div>

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Login Sessions</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Manage your active login sessions</p>
                          </div>
                          <button className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                            Manage
                          </button>
                        </div> */}

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Security Questions</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Set up security questions for account recovery</p>
                          </div>
                          <button className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                            Set Up
                          </button>
                        </div> */}



                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Device Management</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>View and manage your connected devices</p>
                          </div>
                          <button 
                            onClick={() => setShowDeviceManagement(true)}
                            className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                            Manage
                          </button>
                        </div>
                     
                      </div>
                    </div>
                  )}

                  {activeTab === 'account' && (
                    <div className="space-y-6">


                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 border rounded-lg ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600' 
                            : 'border-gray-200'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Deactivate Account</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Hide your posts and profile temporarily</p>
                          </div>
                          <button className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                            effectiveTheme === 'dark' 
                              ? 'border-red-500 text-red-400 hover:bg-red-900' 
                              : 'border-red-300 text-red-700 hover:bg-red-50'
                          }`}>
                            Deactivate
                          </button>
                        </div>
                        
                        <div className={`flex items-center justify-between p-4 border rounded-lg ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600' 
                            : 'border-gray-200'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Delete Account</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Permanently delete your account and all data</p>
                          </div>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}



                  {activeTab === 'privacy' && (
                    <div className="space-y-6">
                      <div className="space-y-4">

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Last seen & online</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Show when you were last online</p>
                          </div>
                          <select className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div> */}

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Profile photos</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can see your profile pictures</p>
                          </div>
                          <select 
                            value={settings.profilePhotos}
                            onChange={(e) => handleProfilePhotosChange(e.target.value)}
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Forwarded messages</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Allow others to forward your messages</p>
                          </div>
                          <select className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div> */}

                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Calls</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can call you</p>
                          </div>
                          <select className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Voice messages</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control voice message access</p>
                          </div>
                          <select className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can message you</p>
                          </div>
                          <select className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="everybody">Everybody</option>
                            <option value="contacts">My contacts</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div> */}

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Date of Birth</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can see your birthday</p>
                          </div>
                          <select 
                            value={settings.birth}
                            onChange={(e) => handleBirthChange(e.target.value)}
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="contacts">My contacts</option>
                            <option value="everybody">Everybody</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bio</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can see your bio</p>
                          </div>
                          <select 
                            value={settings.bio}
                            onChange={(e) => handleBioChange(e.target.value)}
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="contacts">My contacts</option>
                            <option value="everybody">Everybody</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</h4>
                            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Control who can see your email</p>
                          </div>
                          <select 
                            value={settings.email_setting}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                            effectiveTheme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}>
                            <option value="contacts">My contacts</option>
                            <option value="everybody">Everybody</option>
                            <option value="nobody">Nobody</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notification' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {/* <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Push Notifications</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Receive notifications on your device</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Enabled</span>
                            <button className={`relative inline-flex h-6 w-11 items-center rounded-full bg-${currentColor.primary} transition-colors duration-200`}>
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform duration-200" />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email Notifications</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Receive notifications via email</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Enabled</span>
                            <button className={`relative inline-flex h-6 w-11 items-center rounded-full bg-${currentColor.primary} transition-colors duration-200`}>
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform duration-200" />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SMS Notifications</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Receive notifications via SMS</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Disabled</span>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors duration-200">
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform duration-200" />
                            </button>
                          </div>
                        </div> */}

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Comment Notifications</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Notify when someone comments on your Activity/Events</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {settings.commentNotifications ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                              onClick={() => handleToggle('commentNotifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                settings.commentNotifications ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                settings.commentNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          themeSettings.theme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${themeSettings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity Notifications</h4>
                            <p className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Notify about friend activities and updates</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {settings.activityNotifications ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                              onClick={() => handleToggle('activityNotifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                settings.activityNotifications ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                settings.activityNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          themeSettings.theme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${themeSettings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Like Notifications</h4>
                            <p className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Notify when someone likes your content</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {settings.likeNotifications ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                              onClick={() => handleToggle('likeNotifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                settings.likeNotifications ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                settings.likeNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Login Alerts Toggle */}
                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          themeSettings.theme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`font-medium ${themeSettings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Login Alerts</h4>
                            <p className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Notify when someone logs into your account from a new device</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${themeSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {settings.loginAlerts ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                              onClick={() => handleToggle('loginAlerts')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                settings.loginAlerts ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                settings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Fragment>
                  {activeTab === 'theme' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Theme</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Choose your preferred theme appearance</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Light</span>
                                                        <button
                              onClick={() => handleThemeChange(themeSettings.theme === 'light' ? 'dark' : 'light')}
                              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${
                                themeSettings.theme === 'dark' ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                themeSettings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                            <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Dark</span>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Auto Theme</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Automatically switch based on system settings</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {themeSettings.autoTheme ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                              onClick={() => handleThemeToggle('autoTheme')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                themeSettings.autoTheme ? `bg-${currentColor.primary}` : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                themeSettings.autoTheme ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Primary Color</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Choose your primary accent color</p>
                          </div>
                          <select 
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                              effectiveTheme === 'dark' 
                                ? 'border-gray-600 bg-gray-700 text-white' 
                                : 'border-gray-300 bg-white text-gray-700'
                            }`}
                            value={themeSettings.primaryColor}
                            onChange={(e) => handlePrimaryColorChange(e.target.value)}
                          >
                            <option value="orange">Orange</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="purple">Purple</option>
                            <option value="red">Red</option>
                            <option value="pink">Pink</option>
                          </select>
                        </div>

                        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          effectiveTheme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div>
                            <h4 className={`${getFontSizeClassForElement('text-base')} font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Font Size</h4>
                            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Adjust the size of text throughout the app</p>
                          </div>
                          <select 
                            className={`px-4 py-2 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                              effectiveTheme === 'dark' 
                                ? 'border-gray-600 bg-gray-700 text-white' 
                                : 'border-gray-300 bg-white text-gray-700'
                            }`}
                            value={themeSettings.fontSize}
                            onChange={(e) => handleFontSizeChange(e.target.value)}
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="extra-large">Extra Large</option>
                          </select>
                        </div>


                      </div>
                    </div>
                  )}
                  </Fragment>


                </div>

              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Email Update Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseEmailModal}>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-xl w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Update Login Email</h3>
              <button
                onClick={handleCloseEmailModal}
                className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Current Email</label>
                <div className={`px-3 py-2 border rounded-md ${
                  effectiveTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}>
                  {user?.email || 'No email set'}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>New Email</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Current Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="off"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseEmailModal}
                className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                  effectiveTheme === 'dark' 
                    ? 'border-gray-600 text-gray-200 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmail}
                className={`px-4 py-2 bg-${currentColor.primary} text-white rounded-md hover:bg-${currentColor.hover} transition-colors duration-200`}
                disabled={isUpdatingEmail}
              >
                {isUpdatingEmail ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePasswordModal}>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-xl w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
              <button
                onClick={handleClosePasswordModal}
                className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Current Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={currentPasswordForChange}
                  onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>New Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Confirm New Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} focus:border-transparent ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="off"
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClosePasswordModal}
                className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                  effectiveTheme === 'dark' 
                    ? 'border-gray-600 text-gray-200 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                className={`px-4 py-2 bg-${currentColor.primary} text-white rounded-md hover:bg-${currentColor.hover} transition-colors duration-200`}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <Snackbar
          message="Email update initiated. Please check your new email for verification."
          variant="success"
          onClose={() => setShowSuccessMessage(false)}
        />
      )}

      {/* Password Success Message */}
      {showPasswordSuccessMessage && (
        <Snackbar
          message="Password updated successfully!"
          variant="success"
          onClose={() => setShowPasswordSuccessMessage(false)}
        />
      )}

      {/* Device Management Modal */}
      {showDeviceManagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden rounded-lg shadow-xl ${
            effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold ${
                effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Device Management
              </h2>
              <button
                onClick={() => setShowDeviceManagement(false)}
                className={`p-1.5 rounded-full hover:bg-opacity-20 transition-colors ${
                  effectiveTheme === 'dark' ? 'hover:bg-white text-gray-400' : 'hover:bg-gray-500 text-gray-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
              <DeviceManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 