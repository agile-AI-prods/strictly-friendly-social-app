import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { Profile, ConnectionStatus } from '../../types';
import { calculateDistance } from '../../utils/location';
import { RootState } from '../../store';
import { getFilteredUsers, getFriendsCounts, FilteredUsersParams } from '../../api/userApi';
import { getProfile, updateProfile as updateProfileApi } from '../../api/profileApi';

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

interface FilterParams {
  searchTerm?: string;
  interests?: string[];
  maxDistance?: number;
  currentUserLocation?: { latitude: number; longitude: number };
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  totalCount: number;
}

interface UserState {
  allUsers: Profile[];
  profileById: { [id: string]: Profile | undefined };
  loading: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  error: string | null;
  filterParams: FilterParams;
  pagination: PaginationState;
  friendsCounts: { [userId: string]: number };
  profileLoading: { [id: string]: boolean };
}

const initialState: UserState = {
  allUsers: [],
  profileById: {},
  loading: 'idle',
  error: null,
  filterParams: {},
  pagination: {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    totalCount: 0
  },
  friendsCounts: {},
  profileLoading: {},
};

// Async Thunks
export const fetchFilteredProfiles = createAsyncThunk(
  'users/fetchFilteredProfiles',
  async (params: { 
    currentUserId: string; 
    searchTerm?: string;
    interests?: string[];
    maxDistance?: number;
    currentUserLocation?: { latitude: number; longitude: number, city: string };
    page?: number;
    append?: boolean;
  }) => {
    const apiParams: FilteredUsersParams = {
      searchTerm: params.searchTerm,
      interests: params.interests,
      maxDistance: params.maxDistance,
      currentUserLocation: params.currentUserLocation,
      page: params.page || 1,
      limit: 20,
      sortBy: 'distance'
    };
    
    const result = await getFilteredUsers(apiParams);
    
    return {
      profiles: result.profiles,
      page: result.page,
      hasMore: result.hasMore,
      total: result.total,
      append: params.append || false
    };
  }
);

export const fetchProfileById = createAsyncThunk(
  'users/fetchProfileById',
  async (userId: string) => {
    const response = await getProfile(userId);
    return { userId, profile: response };
  }
);

export const fetchFriendsCountsForUsers = createAsyncThunk(
  'users/fetchFriendsCountsForUsers',
  async (userIds: string[]) => {
    const counts = await getFriendsCounts(userIds);
    return counts;
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async ({ userId, profileData }: { userId: string; profileData: Partial<Profile> }, { rejectWithValue }) => {
    try {
      console.log('profileData', profileData);
      const updated = await updateProfileApi(userId, profileData);
      return updated;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilterParams: (state, action) => {
      state.filterParams = { ...state.filterParams, ...action.payload };
    },
    clearFilters: (state) => {
      state.filterParams = {};
    },
    resetPagination: (state) => {
      state.pagination = {
        currentPage: 1,
        pageSize: 10,
        hasMore: true,
        totalCount: 0
      };
    },
    loadMoreUsers: (state) => {
      state.pagination.currentPage += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilteredProfiles.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchFilteredProfiles.fulfilled, (state, action) => {
        state.loading = 'fulfilled';
        
        // Add safety checks for action.payload
        if (!action.payload) {
          console.error('❌ fetchFilteredProfiles: action.payload is undefined');
          return;
        }
        
        // Add safety checks for profiles
        if (!action.payload.profiles || !Array.isArray(action.payload.profiles)) {
          console.error('❌ fetchFilteredProfiles: action.payload.profiles is not an array:', action.payload.profiles);
          return;
        }
        
        if (action.payload.append) {
          // Append new profiles to existing ones
          state.allUsers = [...state.allUsers, ...action.payload.profiles];
          state.pagination.totalCount = state.allUsers.length;
        } else {
          // Replace all profiles (for new searches/filters)
          state.allUsers = action.payload.profiles;
          state.pagination.totalCount = action.payload.profiles.length;
        }
        
        // Add safety checks for pagination fields
        if (typeof action.payload.page === 'number') {
          state.pagination.currentPage = action.payload.page;
        }
        if (typeof action.payload.hasMore === 'boolean') {
          state.pagination.hasMore = action.payload.hasMore;
        }
        
        console.log('✅ fetchFilteredProfiles: Updated state with', action.payload.profiles.length, 'profiles');
      })
      .addCase(fetchFilteredProfiles.rejected, (state, action) => {
        state.loading = 'rejected';
        state.error = action.error.message || 'Failed to fetch profiles';
      })
      .addCase(fetchProfileById.pending, (state, action) => {
        state.profileLoading[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        if (action.payload && action.payload.profile && action.payload.profile.id) {
          state.profileById[action.payload.profile.id] = action.payload.profile;
        }
        state.profileLoading[action.meta.arg] = false;
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.profileLoading[action.meta.arg] = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(fetchFriendsCountsForUsers.fulfilled, (state, action) => {
        state.friendsCounts = { ...state.friendsCounts, ...action.payload };
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          state.profileById[action.payload.id] = action.payload;
        }
        state.loading = 'fulfilled';
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = 'rejected';
        state.error = action.payload as string || 'Failed to update profile';
      });
  },
});

export const { setFilterParams, clearFilters, resetPagination, loadMoreUsers } = userSlice.actions;
export default userSlice.reducer;

// Memoized selector for filtered users
export const selectFilteredUsers = createSelector(
  [(state: RootState) => state.users.allUsers, (state: RootState) => state.users.filterParams],
  (allUsers, filterParams) => {
    console.log('🔍 selectFilteredUsers called:', {
      allUsersLength: allUsers.length,
      filterParams,
      hasFilterParams: !filterParams || Object.keys(filterParams).length === 0
    });

    // Always return allUsers for now to debug the issue
    // The backend is already handling the filtering
    return allUsers;
    
    // TODO: Re-enable client-side filtering after debugging
    /*
    if (!filterParams || Object.keys(filterParams).length === 0) return allUsers;

    return allUsers.filter((user: Profile) => {
      // Text search filter
      if (filterParams.searchTerm) {
        const searchLower = filterParams.searchTerm.toLowerCase();
        const matchesSearch =
          user.name.toLowerCase().includes(searchLower) ||
          (user.bio?.toLowerCase().includes(searchLower)) ||
          (user.location?.city?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Interests filter
      if (filterParams.interests && filterParams.interests.length > 0) {
        const userInterests = user.interests?.map((interest: { label: string }) => 
          interest.label.toLowerCase()
        ) || [];
        const hasMatchingInterest = filterParams.interests.some((interest: string) =>
          userInterests.includes(interest.toLowerCase())
        );
        if (!hasMatchingInterest) return false;
      }

      // Distance filter
      if (filterParams.currentUserLocation && filterParams.maxDistance) {
        if (!user.location) return false;
        const distance = calculateDistance(
          filterParams.currentUserLocation.latitude,
          filterParams.currentUserLocation.longitude,
          user.location.latitude,
          user.location.longitude
        );
        if (distance > filterParams.maxDistance) return false;
        if (!matchesSearch) return false;
      }

      return true;
    });
    */
  }
);

// Selectors for pagination
export const selectPagination = (state: RootState) => state.users.pagination;
export const selectHasMore = (state: RootState) => state.users.pagination.hasMore;
export const selectCurrentPage = (state: RootState) => state.users.pagination.currentPage;
export const selectTotalCount = (state: RootState) => state.users.pagination.totalCount; 

export const selectFriendsCounts = (state: RootState) => state.users.friendsCounts; 

// Selector for profile loading state
export const selectProfileLoading = (userId: string) => (state: RootState) => 
  state.users.profileLoading[userId] || false; 