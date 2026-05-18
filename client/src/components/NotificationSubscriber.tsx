import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchNotifications } from '../store/slices/notificationSlice';
import socketService from '../services/socketService';

export const NotificationSubscriber = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth.user?.id);

  useEffect(() => {
    if (!userId) return;
    
    // Fetch initial notifications
    dispatch(fetchNotifications(userId));
    // Socket.io connection is handled by socketService
    // Real-time notifications are automatically handled by Socket.io event listeners
    console.log('NotificationSubscriber initialized with Socket.io real-time updates');
  }, [dispatch, userId]);

  return null;
} 