import api from './axiosInstance';

export const createProfile = (profileData: any) =>
  api.post('/api/profile', profileData).then(res => res.data);

export const updateProfile = (userId: string, profileData: any) =>
  api.put(`/api/profile/${userId}`, profileData).then(res => res.data);

export const getProfile = (userId: string) =>
  api.get(`/api/profile/${userId}`).then(res => res.data);

export const getMe = () =>
  api.get('/api/profile/me').then(res => res.data);

export const getProfileByCurrentUserEmail = () =>
  api.get('/api/profile/current-user/profile').then(res => res.data);

export const updateProfileByCurrentUserEmail = (profileData: any) =>
  api.put('/api/profile/current-user/profile', profileData).then(res => res.data);

export const getAllProfiles = () =>
  api.get('/api/profile').then(res => res.data);

export const getFilteredProfiles = (filters: {
  searchTerm?: string;
  interests?: string[];
  maxDistance?: number;
  currentUserLocation?: { latitude: number; longitude: number };
  limit?: number;
  offset?: number;
}) =>
  api.get('/api/profile/filtered', {
    params: {
      searchTerm: filters.searchTerm,
      interests: filters.interests?.join(','),
      maxDistance: filters.maxDistance,
      limit: filters.limit,
      offset: filters.offset
    },
    data: {
      currentUserLocation: filters.currentUserLocation
    }
  }).then(res => res.data);

export const uploadProfilePhoto = (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('photo', file);
  
  return api.post(`/api/profile/${userId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

export const uploadCoverImage = (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('cover', file);
  
  return api.post(`/api/profile/${userId}/cover`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

// Backward compatibility export
export const uploadPhoto = uploadProfilePhoto;

export const updateEmail = (newEmail: string, currentPassword: string) =>
  api.put('/api/auth/update-email', {
    newEmail,
    currentPassword
  }).then(res => res.data);

export const updatePassword = (newPassword: string, currentPassword: string) =>
  api.put('/api/auth/update-password', {
    newPassword,
    currentPassword
  }).then(res => res.data); 