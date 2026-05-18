import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PresenceState {
  onlineUsers: string[];
  userStatuses: { [userId: string]: 'online' | 'idle' };
  loading: boolean;
  error: string | null;
}

const initialState: PresenceState = {
  onlineUsers: [],
  userStatuses: {},
  loading: false,
  error: null,
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    setUserStatuses: (state, action: PayloadAction<{ [userId: string]: 'online' | 'idle' }>) => {
      state.userStatuses = action.payload;
    },
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    setUserStatus: (state, action: PayloadAction<{ userId: string; status: 'online' | 'idle' }>) => {
      const { userId, status } = action.payload;
      state.userStatuses[userId] = status;
    },
    clearOnlineUsers: (state) => {
      state.onlineUsers = [];
      state.userStatuses = {};
    },
  },
});

export const { setOnlineUsers, setUserStatuses, addOnlineUser, removeOnlineUser, setUserStatus, clearOnlineUsers } = presenceSlice.actions;

// Selectors
export const selectOnlineUsers = (state: { presence: PresenceState }) => state.presence.onlineUsers;
export const selectUserStatuses = (state: { presence: PresenceState }) => state.presence.userStatuses;
export const selectIsUserOnline = (userId: string) => (state: { presence: PresenceState }) => 
  state.presence.onlineUsers.includes(userId);
export const selectUserStatus = (userId: string) => (state: { presence: PresenceState }) => 
  state.presence.userStatuses[userId] || 'offline';

export default presenceSlice.reducer; 