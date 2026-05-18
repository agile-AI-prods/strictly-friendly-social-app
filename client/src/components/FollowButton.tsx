import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spin } from 'antd';
import { UserPlus, UserMinus } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { followUser, unfollowUser, fetchFollowersCount, fetchFollowingCount, selectFollowStatus, checkIsFollowing } from '../store/slices/followSlice';
import { checkFollowMeStatus } from '../api/settingsApi';

interface FollowButtonProps {
  targetUserId: string;
  targetUserEmail?: string;
  className?: string;
  size?: 'small' | 'middle' | 'large';
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'text';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUserEmail,
  className = '',
  size = 'middle',
  showIcon = true,
  variant = 'default'
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const followStatus = useSelector(selectFollowStatus(targetUserId));
  const followStatusState = useSelector((state: RootState) => state.follows.status);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(true);
  const [followMeLoading, setFollowMeLoading] = useState(false);
  
  // Don't show follow button if viewing own profile
  if (!currentUser || currentUser.id === targetUserId) {
    return null;
  }

  useEffect(() => {
    // Check initial follow status using Redux
    dispatch(checkIsFollowing(targetUserId));
  }, [targetUserId, dispatch]);

  useEffect(() => {
    // Update local state when Redux state changes
    setIsFollowing(followStatus);
  }, [followStatus]);

  // Check if target user allows following
  useEffect(() => {
    const checkFollowPermission = async () => {
      if (!targetUserEmail) {
        setCanFollow(true); // Default to allow if no email provided
        return;
      }

      setFollowMeLoading(true);
      try {
        const result = await checkFollowMeStatus(targetUserEmail);
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
  }, [targetUserEmail]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(targetUserId)).unwrap();
        // Refresh counts
        dispatch(fetchFollowersCount(targetUserId));
        dispatch(fetchFollowingCount(currentUser.id));
      } else {
        await dispatch(followUser(targetUserId)).unwrap();
        // Refresh counts
        dispatch(fetchFollowersCount(targetUserId));
        dispatch(fetchFollowingCount(currentUser.id));
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonProps = () => {
    const baseProps = {
      onClick: handleFollowToggle,
      disabled: isLoading,
      className: className,
      size: size,
    };

    if (variant === 'outline') {
      return {
        ...baseProps,
        type: 'default' as const,
        style: { borderColor: isFollowing ? '#ff4d4f' : '#1890ff' }
      };
    } else if (variant === 'text') {
      return {
        ...baseProps,
        type: 'text' as const,
      };
    } else {
      return {
        ...baseProps,
        type: isFollowing ? 'default' as const : 'primary' as const,
      };
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return <Spin size="small" />;
    }
    
    if (isFollowing) {
      return showIcon ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Unfollow
        </>
      ) : 'Unfollow';
    } else {
      return showIcon ? (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      ) : 'Follow';
  }
  };

  // Don't show follow button if target user doesn't allow following
  if (!canFollow) {
    return null;
  }

  // Show loading state while checking follow permission
  if (followMeLoading) {
    return (
      <Button disabled className={className} size={size}>
        <Spin size="small" />
      </Button>
    );
  }

  return (
    <Button {...getButtonProps()}>
      {getButtonText()}
    </Button>
  );
}; 