import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch } from '../index';
import { fetchNotifications as fetchNotificationsApi, markNotificationAsRead as markNotificationAsReadApi, markAllNotificationsAsRead as markAllNotificationsAsReadApi, deleteNotification as deleteNotificationApi } from '../../api/notificationApi';
import socketService from '../../services/socketService';

export interface Notification {
  id: string;
  type: 'message' | 'connection' | 'activity' | 'activity_update' | 'activity_deleted' | 'discovery' | 'event' | 'like' | 'unlike';
  from_user_id: string;
  to_user_id: string;
  content: string;
  read: boolean;
  created_at: string;
  metadata?: {
    message_id?: string;
    connection_id?: string;
    activity_id?: string;
    user_id?: string;
    like_id?: string;
    target_type?: string;
    activity_title?: string;
    is_comment?: boolean;
    comment_id?: string;
    is_like?: boolean;
    is_unlike?: boolean;
    is_login?: boolean;
    device_info?: {
      browser: string;
      os: string;
      device: string;
      ip: string;
      location: string;
      login_date: string;
    };
  };
}

interface NotificationState {
    notifications: Notification[];
    loading: boolean;
    error: string | null;
    unreadCount: number;
}

const initialState: NotificationState = {
    notifications: [],
    loading: false,
    error: null,
    unreadCount: 0
};

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (userId: string, { rejectWithValue }) => {
        try {
            const notifications = await fetchNotificationsApi();
            return notifications;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            const result = await markNotificationAsReadApi(notificationId);
            return notificationId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            const success = await markAllNotificationsAsReadApi();
            return success;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            const result = await deleteNotificationApi(notificationId);
            return notificationId;
        } catch (error: any) {
            console.error('Error deleting notification:', error);
            return rejectWithValue(error.message);
        }
    }
);

// Create notification
export const createNotification = createAsyncThunk(
    'notifications/createNotification',
    async (notificationData: Omit<Notification, 'id' | 'created_at' | 'read'>, { rejectWithValue }) => {
        try {
            // Use Socket.io for real-time notification creation
            socketService.createNotification(notificationData);
            // Return the notification data for immediate UI update
            return {
                ...notificationData,
                id: Date.now().toString(), // Temporary ID for immediate UI update
                read: false,
                created_at: new Date().toISOString()
            };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            // Check if notification already exists to avoid duplicates
            const existingIndex = state.notifications.findIndex(n => n.id === action.payload.id);
            if (existingIndex === -1) {
                state.notifications.unshift(action.payload);
                if (!action.payload.read) {
                    state.unreadCount += 1;
                }
            }
        },
        updateNotification: (state, action) => {
            const index = state.notifications.findIndex(n => n.id === action.payload.id);
            if (index !== -1) {
                state.notifications[index] = action.payload;
            }
        },
        removeNotification: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter((n: Notification) => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
            })
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.read) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications = state.notifications.filter(n => n.id !== action.payload);
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    }
});

export const { addNotification, updateNotification, removeNotification, markAsRead } = notificationSlice.actions;

// Subscribe to real-time notifications
export const subscribeToNotifications = () => {
    return async (dispatch: AppDispatch): Promise<() => void> => {
        // Socket.io connection is handled by socketService
        // Real-time notifications are automatically handled by Socket.io event listeners
        console.log('Real-time notifications subscription active via Socket.io');
        
        // Return cleanup function (Socket.io cleanup is handled by socketService)
        return () => {
            console.log('Notification subscription cleanup');
        };
    };
};

export default notificationSlice.reducer; 