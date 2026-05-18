import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import messageReducer from './slices/messageSlice';
import connectionReducer from './slices/connectionSlice';
import notificationReducer from './slices/notificationSlice';
import activityReducer from './slices/activitySlice';
import followReducer from './slices/followSlice';
import likeReducer from './slices/likeSlice';
import userReducer from './slices/userSlice';
import presenceReducer from './slices/presenceSlice';
import birthdayReducer from './slices/birthdaySlice';
import commentsReducer from './slices/commentsSlice';
import friendReducer from './slices/friendSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messageReducer,
    connections: connectionReducer,
    notifications: notificationReducer,
    activities: activityReducer,
    follows: followReducer,
    likes: likeReducer,
    users: userReducer,
    presence: presenceReducer,
    birthdays: birthdayReducer,
    comments: commentsReducer,
    friends: friendReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 