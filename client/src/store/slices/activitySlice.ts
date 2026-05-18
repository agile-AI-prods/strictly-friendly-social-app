import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchActivities as fetchActivitiesApi, createActivity as createActivityApi, updateActivity as updateActivityApi, deleteActivity as deleteActivityApi, inviteParticipants as inviteParticipantsApi, updateParticipantStatus as updateParticipantStatusApi, getSuggestedActivities as getSuggestedActivitiesApi, getActivityById } from '../../api/activityApi';
import { Profile } from '../../types';

export type ActivityType = 'Outdoor' | 'Indoor' | 'Social' | 'Arts' | 'Food' | 'Fitness';
export type ActivityPrivacy = 'public' | 'connections' | 'private';
export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'joined' | 'joining' | 'inviting';

export interface User {
  id: string;
  name: string;
  photo_url: string;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string | null;
  user: User;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  start_datetime: string;
  end_datetime: string;
  location: string;
  description: string;
  creator_id: string;
  max_participants: number;
  privacy: ActivityPrivacy;
  status: ActivityStatus;
  image_url: string;
  created_at: string;
  updated_at: string;
  participants: ActivityParticipant[];
  creator: Profile | null;
  hide_exact_address?: boolean;
}

interface ActivityState {
  activities: Activity[];
  suggestedActivities: Activity[];
  singleActivity: Activity | null;
  loading: boolean;
  error: string | null;
  filters: {
    type: ActivityType[];
    date: string | null;
    searchQuery: string;
    event: string[];
    place: string[];
  };
  activityTypes: ActivityType[];
  eventOptions: string[];
  placeOptions: string[];
  status: {
    updateParticipant: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    inviteParticipants: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    createActivity: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    updateActivity: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    deleteActivity: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchSingleActivity: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
  selectedActivity: Activity,
  showCreateModal: boolean,
  showEventDetail: boolean,
  uploadedImage: File | null,
}

const initialState: ActivityState = {
  activities: [],
  suggestedActivities: [],
  singleActivity: null,
  loading: false,
  error: null,
  filters: {
    type: [],
    date: null,
    searchQuery: '',
    event: [],
    place: [],
  },
  activityTypes: ['Outdoor', 'Indoor', 'Social', 'Arts', 'Food', 'Fitness'],
  eventOptions: ['Party', 'Meeting', 'Workshop', 'Concert', 'Sports', 'Dinner', 'Movie', 'Game Night', 'Study Group', 'Hiking', 'Yoga', 'Dance'],
  placeOptions: ['Home', 'Park', 'Restaurant', 'Gym', 'Museum', 'Theater', 'Library', 'Beach', 'Mountain', 'City Center', 'Cafe', 'Studio'],
  status: {
    updateParticipant: 'idle',
    inviteParticipants: 'idle',
    createActivity: 'idle',
    updateActivity: 'idle',
    deleteActivity: 'idle',
    fetchSingleActivity: 'idle',
  },
  selectedActivity: {
    id: '',
    title: '',
    type: 'Outdoor',
    start_datetime: '',
    end_datetime: '',
    location: '',
    description: '',
    creator_id: '',
    max_participants: 0,
    privacy: 'public',
    status: 'upcoming',
    image_url: '',
    created_at: '',
    updated_at: '',
    participants: [],
    creator: null
  },
  showCreateModal: false,
  showEventDetail: false,
  uploadedImage: null
};

// Async thunks
export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async () => {
    const data = await fetchActivitiesApi();
    return data;
  }
);

export const createActivity = createAsyncThunk(
  'activities/createActivity',
  async (activityData: Partial<Activity>) => {
    const data = await createActivityApi(activityData);
    return data;
  }
);

export const updateActivity = createAsyncThunk(
  'activities/updateActivity',
  async ({ id, updates }: { id: string; updates: Partial<Activity> }) => {
    const data = await updateActivityApi(id, updates);
    return data;
  }
);

export const deleteActivity = createAsyncThunk(
  'activities/deleteActivity',
  async (id: string) => {
    const data = await deleteActivityApi(id);
    return id;
  }
);

export const inviteParticipants = createAsyncThunk(
  'activities/inviteParticipants',
  async ({ activityId, userIds }: { activityId: string; userIds: string[] }) => {
    const data = await inviteParticipantsApi(activityId, userIds);
    return data;
  }
);

export const updateParticipantStatus = createAsyncThunk(
  'activities/updateParticipantStatus',
  async ({ activityId, userId, status }: { activityId: string; userId: string; status: ParticipantStatus }) => {
    const data = await updateParticipantStatusApi(activityId, userId, status);
    return data;
  }
);

export const getSuggestedActivities = createAsyncThunk(
  'activities/getSuggestedActivities',
  async (userId: string) => {
    const data = await getSuggestedActivitiesApi(userId);
    return data;
  }
);

export const fetchSingleActivity = createAsyncThunk(
  'activities/fetchSingleActivity',
  async (id: string) => {
    const data = await getActivityById(id);
    return data;
  }
);

const activitySlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedActivity: (state, action) => {
      state.selectedActivity = action.payload;
    },
    setShowCreateModal: (state, action) => {
      state.showCreateModal = action.payload
    },
    setShowEventDetail: (state, action) => {
      state.showEventDetail = action.payload
    },
    setUploadedImage: (state, action) => {
      state.uploadedImage = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch activities
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      })
      // Create activity
      .addCase(createActivity.pending, (state) => {
        state.status.createActivity = 'pending';
        state.error = null;
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.status.createActivity = 'fulfilled';
        state.activities.push(action.payload);
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.status.createActivity = 'rejected';
        state.error = action.error.message || 'Failed to create activity';
      })
      // Update activity
      .addCase(updateActivity.pending, (state) => {
        state.status.updateActivity = 'pending';
        state.error = null;
      })
      .addCase(updateActivity.fulfilled, (state, action) => {
        state.status.updateActivity = 'fulfilled';
        const index = state.activities.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.activities[index] = action.payload;
        }
      })
      .addCase(updateActivity.rejected, (state, action) => {
        state.status.updateActivity = 'rejected';
        state.error = action.error.message || 'Failed to update activity';
      })
      // Delete activity
      .addCase(deleteActivity.pending, (state) => {
        state.status.deleteActivity = 'pending';
        state.error = null;
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.status.deleteActivity = 'fulfilled';
        state.activities = state.activities.filter(a => a.id !== action.payload);
      })
      .addCase(deleteActivity.rejected, (state, action) => {
        state.status.deleteActivity = 'rejected';
        state.error = action.error.message || 'Failed to delete activity';
      })
      // Update participant status
      .addCase(updateParticipantStatus.pending, (state) => {
        state.status.updateParticipant = 'pending';
        state.error = null;
      })
      .addCase(updateParticipantStatus.fulfilled, (state, action) => {
        state.status.updateParticipant = 'fulfilled';
        const activity = state.activities.find(a => a.id === action.payload.activity_id);
        if (activity) {
          const participantIndex = activity.participants.findIndex(p => p.id === action.payload.id);
          if (participantIndex !== -1) {
            // Update existing participant
            activity.participants[participantIndex] = action.payload;
          } else {
            // Add new participant
            activity.participants.push(action.payload);
          }
        }
      })
      .addCase(updateParticipantStatus.rejected, (state, action) => {
        state.status.updateParticipant = 'rejected';
        state.error = action.error.message || 'Failed to update participant status';
      })
      // Invite participants
      .addCase(inviteParticipants.pending, (state) => {
        state.status.inviteParticipants = 'pending';
        state.error = null;
      })
      .addCase(inviteParticipants.fulfilled, (state, action) => {
        state.status.inviteParticipants = 'fulfilled';
        const activity = state.activities.find(a => a.id === action.payload[0]?.activity_id);
        if (activity) {
          activity.participants.push(...action.payload);
        }
      })
      .addCase(inviteParticipants.rejected, (state, action) => {
        state.status.inviteParticipants = 'rejected';
        state.error = action.error.message || 'Failed to invite participants';
      })
      // Fetch single activity
      .addCase(fetchSingleActivity.pending, (state) => {
        state.status.fetchSingleActivity = 'pending';
        state.error = null;
      })
      .addCase(fetchSingleActivity.fulfilled, (state, action) => {
        state.status.fetchSingleActivity = 'fulfilled';
        state.singleActivity = action.payload;
      })
      .addCase(fetchSingleActivity.rejected, (state, action) => {
        state.status.fetchSingleActivity = 'rejected';
        state.error = action.error.message || 'Failed to fetch activity';
      });
  },
});

export const { setFilters, clearFilters, setSelectedActivity, setShowCreateModal, setShowEventDetail, setUploadedImage } = activitySlice.actions;
export default activitySlice.reducer; 