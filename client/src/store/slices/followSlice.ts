import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { followUser as followUserApi, unfollowUser as unfollowUserApi, fetchFollowingCount as fetchFollowingCountApi, fetchFollowersCount as fetchFollowersCountApi, isFollowing as isFollowingApi, getFollowers as getFollowersApi, getFollowing as getFollowingApi } from '../../api/followApi';

interface FollowState {
  // Using a map to store counts by userId to easily access them in components
  followingCounts: { [userId: string]: number | null };
  followersCounts: { [userId: string]: number | null };
  // Track follow status for current user
  followStatus: { [userId: string]: boolean };
  // Store followers and following lists
  followers: { [userId: string]: any[] };
  following: { [userId: string]: any[] };
  status: {
    followUser: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    unfollowUser: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchFollowingCount: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchFollowersCount: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    isFollowing: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    getFollowers: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    getFollowing: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
  error: string | null;
}

const initialState: FollowState = {
  followingCounts: {},
  followersCounts: {},
  followStatus: {},
  followers: {},
  following: {},
  status: {
    followUser: 'idle',
    unfollowUser: 'idle',
    fetchFollowingCount: 'idle',
    fetchFollowersCount: 'idle',
    isFollowing: 'idle',
    getFollowers: 'idle',
    getFollowing: 'idle',
  },
  error: null,
};

// Async Thunks
export const followUser = createAsyncThunk(
  'follows/followUser',
  async (followedId: string) => {
    const response = await followUserApi(followedId);
    if (!response) throw new Error('Failed to follow user');
    return response;
  }
);

export const unfollowUser = createAsyncThunk(
  'follows/unfollowUser',
  async (followedId: string) => {
    const success = await unfollowUserApi(followedId);
    if (!success) throw new Error('Failed to unfollow user');
    return followedId; // Return followedId to update state
  }
);

export const fetchFollowingCount = createAsyncThunk(
  'follows/fetchFollowingCount',
  async (userId: string) => {
    const count = await fetchFollowingCountApi(userId);
    return { userId, count };
  }
);

export const fetchFollowersCount = createAsyncThunk(
  'follows/fetchFollowersCount',
  async (userId: string) => {
    const count = await fetchFollowersCountApi(userId);
    return { userId, count };
  }
);

export const checkIsFollowing = createAsyncThunk(
  'follows/checkIsFollowing',
  async (followedId: string) => {
    const isFollowing = await isFollowingApi(followedId);
    return { followedId, isFollowing };
  }
);

export const fetchFollowers = createAsyncThunk(
  'follows/fetchFollowers',
  async (userId: string) => {
    const followers = await getFollowersApi(userId);
    return { userId, followers };
  }
);

export const fetchFollowing = createAsyncThunk(
  'follows/fetchFollowing',
  async (userId: string) => {
    const following = await getFollowingApi(userId);
    return { userId, following };
  }
);

const followSlice = createSlice({
  name: 'follows',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Follow User
      .addCase(followUser.pending, (state) => {
        state.status.followUser = 'pending';
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.status.followUser = 'fulfilled';
        // Update follow status
        state.followStatus[action.payload.followed_id] = true;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.status.followUser = 'rejected';
        state.error = action.error.message || 'Failed to follow user';
      })
      // Unfollow User
      .addCase(unfollowUser.pending, (state) => {
        state.status.unfollowUser = 'pending';
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.status.unfollowUser = 'fulfilled';
        // Update follow status
        state.followStatus[action.payload] = false;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.status.unfollowUser = 'rejected';
        state.error = action.error.message || 'Failed to unfollow user';
      })
      // Fetch Following Count
      .addCase(fetchFollowingCount.pending, (state) => {
        state.status.fetchFollowingCount = 'pending';
      })
      .addCase(fetchFollowingCount.fulfilled, (state, action) => {
        state.status.fetchFollowingCount = 'fulfilled';
        state.followingCounts[action.payload.userId] = action.payload.count;
      })
      .addCase(fetchFollowingCount.rejected, (state, action) => {
        state.status.fetchFollowingCount = 'rejected';
        state.error = action.error.message || 'Failed to fetch following count';
      })
      // Fetch Followers Count
      .addCase(fetchFollowersCount.pending, (state) => {
        state.status.fetchFollowersCount = 'pending';
      })
      .addCase(fetchFollowersCount.fulfilled, (state, action) => {
        state.status.fetchFollowersCount = 'fulfilled';
        state.followersCounts[action.payload.userId] = action.payload.count;
      })
      .addCase(fetchFollowersCount.rejected, (state, action) => {
        state.status.fetchFollowersCount = 'rejected';
        state.error = action.error.message || 'Failed to fetch followers count';
      })
      // Check Is Following
      .addCase(checkIsFollowing.pending, (state) => {
        state.status.isFollowing = 'pending';
      })
      .addCase(checkIsFollowing.fulfilled, (state, action) => {
        state.status.isFollowing = 'fulfilled';
        state.followStatus[action.payload.followedId] = action.payload.isFollowing;
      })
      .addCase(checkIsFollowing.rejected, (state, action) => {
        state.status.isFollowing = 'rejected';
        state.error = action.error.message || 'Failed to check follow status';
      })
      // Fetch Followers
      .addCase(fetchFollowers.pending, (state) => {
        state.status.getFollowers = 'pending';
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.status.getFollowers = 'fulfilled';
        state.followers[action.payload.userId] = action.payload.followers;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.status.getFollowers = 'rejected';
        state.error = action.error.message || 'Failed to fetch followers';
      })
      // Fetch Following
      .addCase(fetchFollowing.pending, (state) => {
        state.status.getFollowing = 'pending';
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.status.getFollowing = 'fulfilled';
        state.following[action.payload.userId] = action.payload.following;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.status.getFollowing = 'rejected';
        state.error = action.error.message || 'Failed to fetch following';
      });
  },
});

export default followSlice.reducer;

// Selector for follow status
export const selectFollowStatus = (userId: string) => (state: RootState) => {
  return state.follows.followStatus[userId] || false;
};

// Selector for followers list
export const selectFollowers = (userId: string) => (state: RootState) => {
  return state.follows.followers[userId] || [];
};

// Selector for following list
export const selectFollowing = (userId: string) => (state: RootState) => {
  return state.follows.following[userId] || [];
};

// Selector for followers count
export const selectFollowersCount = (userId: string) => (state: RootState) => {
  return state.follows.followersCounts[userId] || 0;
};

// Selector for following count
export const selectFollowingCount = (userId: string) => (state: RootState) => {
  return state.follows.followingCounts[userId] || 0;
}; 