import api from './axiosInstance';

export const getAllActivities = () =>
  api.get('/api/activities').then(res => res.data);

// Backward compatibility export
export const fetchActivities = getAllActivities;

export const getActivityById = (id: string) =>
  api.get(`/api/activities/${id}`).then(res => res.data);

export const createActivity = (activityData: any) =>
  api.post('/api/activities', activityData).then(res => res.data);

export const updateActivity = (id: string, updates: any) =>
  api.put(`/api/activities/${id}`, updates).then(res => res.data);

export const deleteActivity = (id: string) =>
  api.delete(`/api/activities/${id}`).then(res => res.data);


export const getActivities = (filters?: {
  type?: string[];
  date?: string;
  searchQuery?: string;
  privacy?: 'public' | 'connections' | 'private';
}) =>
  api.get('/api/activities/filtered', {
    params: {
      type: filters?.type?.join(','),
      date: filters?.date,
      searchQuery: filters?.searchQuery,
      privacy: filters?.privacy
    }
  }).then(res => res.data);

export const inviteParticipants = (activityId: string, userIds: string[]) =>
  api.post('/api/activities/invite', { activityId, userIds }).then(res => res.data);

export const updateParticipantStatus = (
  activityId: string,
  userId: string,
  status: 'invited' | 'accepted' | 'declined' | 'joined' | 'joining' | 'inviting'
) =>
  api.post('/api/activities/participant-status', { activityId, userId, status }).then(res => res.data);

export const getSuggestedActivities = (userId: string) =>
  api.get(`/api/activities/suggested/${userId}`).then(res => res.data);

export const uploadActivityImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  return api.post('/api/activities/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
}; 