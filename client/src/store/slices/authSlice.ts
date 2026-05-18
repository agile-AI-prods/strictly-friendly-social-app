import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types';
import { logout as logoutApi, signup as signupApi } from '../../api/authApi';
import { updateProfile as updateProfileApi } from '../../api/profileApi';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, profileData }: { userId: string; profileData: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await updateProfileApi(userId, profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update profile');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, name, recaptchaToken }: { email: string; password: string; name: string; recaptchaToken: string }, { rejectWithValue }) => {
    try {
      const response = await signupApi(email, password, name, recaptchaToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to sign up');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to logout');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      console.log('=== Redux loginSuccess ===');
      console.log('Action payload:', action.payload);
      console.log('User ID:', action.payload.id);
      console.log('User object:', action.payload);
      console.log('========================');
      
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
      
      console.log('State after update:', state);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.isLoading = false;
      state.user = null;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        // Even if logout API fails, clear the local state
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
        state.error = null;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  updateUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user; 