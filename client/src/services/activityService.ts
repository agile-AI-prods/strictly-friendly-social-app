import { getAllActivities as getAllActivitiesApi, getActivityById as getActivityByIdApi, createActivity as createActivityApi, updateActivity as updateActivityApi, deleteActivity as deleteActivityApi, getActivities as getActivitiesApi, inviteParticipants as inviteParticipantsApi, updateParticipantStatus as updateParticipantStatusApi, getSuggestedActivities as getSuggestedActivitiesApi, uploadActivityImage as uploadActivityImageApi } from '../api/activityApi';
import { Activity, ActivityParticipant } from '../store/slices/activitySlice';

export const activityService = {
  // Fetch activities with filters
  async getActivities(filters?: {
    type?: string[];
    date?: string;
    searchQuery?: string;
    privacy?: 'public' | 'connections' | 'private';
  }) {
    return await getActivitiesApi(filters);
  },

  // Create a new activity
  async createActivity(activityData: Partial<Activity>) {
    return await createActivityApi(activityData);
  },

  // Update an activity
  async updateActivity(id: string, updates: Partial<Activity>) {
    return await updateActivityApi(id, updates);
  },

  // Delete an activity
  async deleteActivity(id: string) {
    return await deleteActivityApi(id);
  },

  // Invite participants to an activity
  async inviteParticipants(activityId: string, userIds: string[]) {
    return await inviteParticipantsApi(activityId, userIds);
  },

  // Update participant status
  async updateParticipantStatus(
    activityId: string,
    userId: string,
    status: 'accepted' | 'declined'
  ) {
    return await updateParticipantStatusApi(activityId, userId, status);
  },

  // Get suggested activities for a user
  async getSuggestedActivities(userId: string) {
    return await getSuggestedActivitiesApi(userId);
  },

  // Subscribe to activity updates (real-time)
  subscribeToActivityUpdates(
    activityId: string,
    callback: (payload: any) => void
  ) {
    // This would need to be implemented with Socket.io
    // For now, we'll keep the existing implementation
    console.log('Activity subscription not yet migrated to Socket.io');
  },

  // Upload image for activity
  async uploadImageToStorage(file: File, currentUserId: string): Promise<string | null> {
    try {
      const result = await uploadActivityImageApi(file);
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading activity image:', error);
      return null;
    }
  }
}; 