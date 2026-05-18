import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Profile } from '../../types';
import { addFriend as addFriendApi, removeFriend as removeFriendApi, getFriends as getFriendsApi, getFriendsList as getFriendsListApi, checkIsFriend as checkIsFriendApi } from '../../api/friendApi';

interface FriendState {
  friends: Profile[];
  friendStatuses: Record<string, boolean>; // userId -> isFriend
  loading: {
    addFriend: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    removeFriend: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchFriends: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    checkStatus: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
  error: string | null;
}

const initialState: FriendState = {
  friends: [],
  friendStatuses: {},
  loading: {
    addFriend: 'idle',
    removeFriend: 'idle',
    fetchFriends: 'idle',
    checkStatus: 'idle'
  },
  error: null
};

// Async thunks
export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friendId: string) => {
    return await addFriendApi(friendId);
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId: string) => {
    return await removeFriendApi(friendId);
  }
);

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async () => {
    return await getFriendsApi();
  }
);

export const checkFriendStatus = createAsyncThunk(
  'friends/checkStatus',
  async (friendId: string) => {
    return await checkIsFriendApi(friendId);
  }
);

const friendSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFriendStatus: (state, action: PayloadAction<{ userId: string; isFriend: boolean }>) => {
      state.friendStatuses[action.payload.userId] = action.payload.isFriend;
    }
  },
  extraReducers: (builder) => {
    builder
      // Add Friend
      .addCase(addFriend.pending, (state) => {
        state.loading.addFriend = 'pending';
        state.error = null;
      })
      .addCase(addFriend.fulfilled, (state, action) => {
        state.loading.addFriend = 'fulfilled';
        state.friendStatuses[action.payload.friendId] = true;
      })
      .addCase(addFriend.rejected, (state, action) => {
        state.loading.addFriend = 'rejected';
        state.error = action.error.message || 'Failed to add friend';
      })
      // Remove Friend
      .addCase(removeFriend.pending, (state) => {
        state.loading.removeFriend = 'pending';
        state.error = null;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.loading.removeFriend = 'fulfilled';
        state.friendStatuses[action.payload.friendId] = false;
        state.friends = state.friends.filter(friend => friend.id !== action.payload.friendId);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.loading.removeFriend = 'rejected';
        state.error = action.error.message || 'Failed to remove friend';
      })
      // Fetch Friends
      .addCase(fetchFriends.pending, (state) => {
        state.loading.fetchFriends = 'pending';
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading.fetchFriends = 'fulfilled';
        state.friends = action.payload.friends || [];
        // Update friend statuses for all friends
        action.payload.friends?.forEach((friend: Profile) => {
          state.friendStatuses[friend.id] = true;
        });
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading.fetchFriends = 'rejected';
        state.error = action.error.message || 'Failed to fetch friends';
      })
      // Check Friend Status
      .addCase(checkFriendStatus.pending, (state) => {
        state.loading.checkStatus = 'pending';
        state.error = null;
      })
      .addCase(checkFriendStatus.fulfilled, (state, action) => {
        state.loading.checkStatus = 'fulfilled';
        state.friendStatuses[action.payload.friendId] = action.payload.isFriend;
      })
      .addCase(checkFriendStatus.rejected, (state, action) => {
        state.loading.checkStatus = 'rejected';
        state.error = action.error.message || 'Failed to check friend status';
      });
  }
});

export const { clearError, setFriendStatus } = friendSlice.actions;

// Selectors
export const selectFriends = (state: RootState) => state.friends.friends;
export const selectFriendStatuses = (state: RootState) => state.friends.friendStatuses;
export const selectIsFriend = (userId: string) => (state: RootState) => 
  state.friends.friendStatuses[userId] || false;
export const selectFriendLoading = (state: RootState) => state.friends.loading;
export const selectFriendError = (state: RootState) => state.friends.error;

export default friendSlice.reducer; 