import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BirthdayEvent } from '../../services/birthdayService';
import { getFriendsBirthdays, getFriendsBirthdaysForYear, getUpcomingBirthdays, getTodaysBirthdays } from '../../api/birthdayApi';

interface BirthdayState {
  birthdays: BirthdayEvent[];
  upcomingBirthdays: BirthdayEvent[];
  todaysBirthdays: BirthdayEvent[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: BirthdayState = {
  birthdays: [],
  upcomingBirthdays: [],
  todaysBirthdays: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchFriendsBirthdays = createAsyncThunk(
  'birthdays/fetchFriendsBirthdays',
  async (userId: string) => {
    return await getFriendsBirthdays(userId);
  }
);

export const fetchBirthdaysForYear = createAsyncThunk(
  'birthdays/fetchBirthdaysForYear',
  async ({ userId, year }: { userId: string; year: number }) => {
    return await getFriendsBirthdaysForYear(userId, year);
  }
);

export const fetchUpcomingBirthdays = createAsyncThunk(
  'birthdays/fetchUpcomingBirthdays',
  async (userId: string) => {
    return await getUpcomingBirthdays(userId);
  }
);

export const fetchTodaysBirthdays = createAsyncThunk(
  'birthdays/fetchTodaysBirthdays',
  async (userId: string) => {
    return await getTodaysBirthdays(userId);
  }
);

const birthdaySlice = createSlice({
  name: 'birthdays',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriendsBirthdays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendsBirthdays.fulfilled, (state, action) => {
        state.loading = false;
        state.birthdays = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchFriendsBirthdays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch birthdays';
      })
      .addCase(fetchBirthdaysForYear.fulfilled, (state, action) => {
        state.birthdays = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchUpcomingBirthdays.fulfilled, (state, action) => {
        state.upcomingBirthdays = action.payload;
      })
      .addCase(fetchTodaysBirthdays.fulfilled, (state, action) => {
        state.todaysBirthdays = action.payload;
      });
  },
});

export const { clearError } = birthdaySlice.actions;
export default birthdaySlice.reducer; 