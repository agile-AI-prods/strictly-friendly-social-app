import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { likeItem as likeItemApi, unlikeItem as unlikeItemApi, fetchLikesCount as fetchLikesCountApi, checkLikeStatus as checkLikeStatusApi } from '../../api/likeApi';

interface LikeState {
  // Using a map to store likes counts by targetId and targetType
  counts: { [targetId: string]: { [targetType: string]: number | null } };
  // Track like status for current user
  likeStatus: { [targetId: string]: { [targetType: string]: boolean } };
  status: {
    likeItem: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    unlikeItem: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchLikesCount: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
  error: string | null;
}

const initialState: LikeState = {
  counts: {},
  likeStatus: {},
  status: {
    likeItem: 'idle',
    unlikeItem: 'idle',
    fetchLikesCount: 'idle',
  },
  error: null,
};

// Async Thunks
export const likeItem = createAsyncThunk(
  'likes/likeItem',
  async ({ targetId, targetType }: { targetId: string; targetType: any }) => {
    const response = await likeItemApi(targetId, targetType);
    if (!response) throw new Error('Failed to like item');
    return response; // Return the liked item to update state if needed
  }
);

export const unlikeItem = createAsyncThunk(
  'likes/unlikeItem',
  async ({ targetId, targetType }: { targetId: string; targetType: any }) => {
    const success = await unlikeItemApi(targetId, targetType);
    if (!success) throw new Error('Failed to unlike item');
    return { targetId, targetType }; // Return IDs to update state
  }
);

export const fetchLikesCount = createAsyncThunk(
  'likes/fetchLikesCount',
  async ({ targetId, targetType }: { targetId: string; targetType: any }) => {
    const count = await fetchLikesCountApi(targetId, targetType);
    return { targetId, targetType, count };
  }
);

const likeSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Like Item
      .addCase(likeItem.pending, (state) => {
        state.status.likeItem = 'pending';
        state.error = null;
      })
      .addCase(likeItem.fulfilled, (state, action) => {
        state.status.likeItem = 'fulfilled';
        // Increment the count immediately after a successful like
        const { target_id, target_type } = action.payload;
        if (!state.counts[target_id]) {
          state.counts[target_id] = {};
        }
        state.counts[target_id][target_type] = (state.counts[target_id][target_type] || 0) + 1;
        
        // Update like status
        if (!state.likeStatus[target_id]) {
          state.likeStatus[target_id] = {};
        }
        state.likeStatus[target_id][target_type] = true;
      })
      .addCase(likeItem.rejected, (state, action) => {
        state.status.likeItem = 'rejected';
        state.error = action.error.message || 'Failed to like item';
      })
      // Unlike Item
      .addCase(unlikeItem.pending, (state) => {
        state.status.unlikeItem = 'pending';
        state.error = null;
      })
      .addCase(unlikeItem.fulfilled, (state, action) => {
        state.status.unlikeItem = 'fulfilled';
        // Decrement the count immediately after a successful unlike
        const { targetId, targetType } = action.payload;
        if (state.counts[targetId] && state.counts[targetId][targetType]) {
          state.counts[targetId][targetType] = Math.max(0, (state.counts[targetId][targetType] || 0) - 1);
        }
        
        // Update like status
        if (state.likeStatus[targetId]) {
          state.likeStatus[targetId][targetType] = false;
        }
      })
      .addCase(unlikeItem.rejected, (state, action) => {
        state.status.unlikeItem = 'rejected';
        state.error = action.error.message || 'Failed to unlike item';
      })
      // Fetch Likes Count
      .addCase(fetchLikesCount.pending, (state) => {
        state.status.fetchLikesCount = 'pending';
      })
      .addCase(fetchLikesCount.fulfilled, (state, action) => {
        state.status.fetchLikesCount = 'fulfilled';
        const { targetId, targetType, count } = action.payload;
        if (!state.counts[targetId]) {
          state.counts[targetId] = {};
        }
        state.counts[targetId][targetType] = count;
      })
      .addCase(fetchLikesCount.rejected, (state, action) => {
        state.status.fetchLikesCount = 'rejected';
        state.error = action.error.message || 'Failed to fetch likes count';
      });
  },
});

export default likeSlice.reducer; 

// Selector for like status
export const selectLikeStatus = (targetId: string, targetType: string) => (state: RootState) => {
  return state.likes.likeStatus[targetId]?.[targetType] || false;
}; 