import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, List, Avatar, Spin, Empty } from 'antd';
import { User, Users } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { useAppDispatch } from '../store/hooks';
import { fetchFollowers, fetchFollowing, selectFollowers, selectFollowing } from '../store/slices/followSlice';

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  visible: boolean;
  onClose: () => void;
}

interface FollowUser {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  type,
  visible,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Use Redux selectors for data
  const followers = useSelector(selectFollowers(userId));
  const following = useSelector(selectFollowing(userId));
  
  const users = type === 'followers' 
    ? followers.map((item: any) => ({
        id: item.follower.id,
        name: item.follower.name,
        photo_url: item.follower.photo_url,
        created_at: item.created_at
      }))
    : following.map((item: any) => ({
        id: item.followed.id,
        name: item.followed.name,
        photo_url: item.followed.photo_url,
        created_at: item.created_at
      }));

  useEffect(() => {
    if (visible && userId) {
      loadUsers();
    }
  }, [visible, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (type === 'followers') {
        await dispatch(fetchFollowers(userId)).unwrap();
      } else {
        await dispatch(fetchFollowing(userId)).unwrap();
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    return type === 'followers' ? 'Followers' : 'Following';
  };

  const getEmptyText = () => {
    return type === 'followers' 
      ? 'No followers yet' 
      : 'Not following anyone yet';
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          {type === 'followers' ? (
            <Users className="w-5 h-5 mr-2" />
          ) : (
            <User className="w-5 h-5 mr-2" />
          )}
          {getTitle()} ({users.length})
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : users.length > 0 ? (
        <List
          dataSource={users}
          renderItem={(user) => (
            <List.Item className="px-0">
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={user.photo_url} 
                    size={40}
                    className="bg-gray-200"
                  >
                    {user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                }
                title={
                  <span className="font-medium text-gray-900">
                    {user.name}
                  </span>
                }
                description={
                  <span className="text-gray-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={getEmptyText()}
          className="py-8"
        />
      )}
    </Modal>
  );
}; 