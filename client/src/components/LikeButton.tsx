import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spin } from 'antd';
import { Heart, HeartOff } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { likeItem, unlikeItem, fetchLikesCount, selectLikeStatus } from '../store/slices/likeSlice';
import { useTheme } from '../context/ThemeContext';

interface LikeButtonProps {
  targetId: string;
  targetType: 'activity' | 'post' | 'profile' | 'comment';
  className?: string;
  size?: 'small' | 'middle' | 'large';
  showIcon?: boolean;
  showCount?: boolean;
  variant?: 'default' | 'outline' | 'text';
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  targetId,
  targetType,
  className = '',
  size = 'middle',
  showIcon = true,
  showCount = true,
  variant = 'default'
}) => {
  const { currentColor } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const likeStatus = useSelector(selectLikeStatus(targetId, targetType));
  const likeCount = useSelector((state: RootState) => 
    state.likes.counts[targetId]?.[targetType] || 0
  );
  
  const [isLoading, setIsLoading] = useState(false);

  // Don't show like button if user is not authenticated
  if (!currentUser) {
    return null;
  }

  useEffect(() => {
    // Fetch like count from Redux
    dispatch(fetchLikesCount({ targetId, targetType }));
  }, [targetId, targetType, dispatch]);

  const handleLikeToggle = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      if (likeStatus) { // Use likeStatus directly
        await dispatch(unlikeItem({ targetId, targetType })).unwrap();
      } else {
        await dispatch(likeItem({ targetId, targetType })).unwrap();
      }
    } catch (error) {
      console.error('Error toggling like status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonProps = () => {
    const baseProps = {
      onClick: handleLikeToggle,
      disabled: isLoading,
      className: className,
      size: size,
    };

    if (variant === 'outline') {
      return {
        ...baseProps,
        type: 'default' as const,
        style: { 
          borderColor: likeStatus ? '#ff4d4f' : currentColor.primary === 'orange-500' ? '#f97316' : '#3b82f6',
          color: likeStatus ? '#ff4d4f' : currentColor.primary === 'orange-500' ? '#f97316' : '#3b82f6'
        }
      };
    } else if (variant === 'text') {
      return {
        ...baseProps,
        type: 'text' as const,
        style: { color: likeStatus ? '#ff4d4f' : currentColor.primary === 'orange-500' ? '#f97316' : '#3b82f6' }
      };
    } else {
      return {
        ...baseProps,
        type: likeStatus ? 'default' as const : 'primary' as const,
        style: likeStatus ? { 
          backgroundColor: '#fff2f0', 
          borderColor: '#ffccc7',
          color: '#ff4d4f'
        } : {}
      };
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return <Spin size="small" />;
    }
    
    const icon = likeStatus ? (
      <Heart className="w-4 h-4 mr-1" fill="#ff4d4f" />
    ) : (
      <Heart className="w-4 h-4 mr-1" style={{ color: currentColor.primary === 'orange-500' ? '#f97316' : '#3b82f6' }} />
    );
    
    const text = likeStatus ? 'Liked' : 'Like';
    const countText = showCount && likeCount > 0 ? ` (${likeCount})` : '';
    
    return showIcon ? (
      <>
        {icon}
        {text}{countText}
      </>
    ) : (
      `${text}${countText}`
    );
  };

  return (
    <Button {...getButtonProps()}>
      {getButtonText()}
    </Button>
  );
}; 