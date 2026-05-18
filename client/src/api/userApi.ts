import api from './axiosInstance';

export interface FilteredUsersParams {
  searchTerm?: string;
  interests?: string[];
  maxDistance?: number;
  currentUserLocation?: {
    latitude: number;
    longitude: number;
  };
  page?: number;
  limit?: number;
  sortBy?: 'distance' | 'name' | 'age';
}

export interface FilteredUsersResponse {
  profiles: any[];
  total: number;
  hasMore: boolean;
  page: number;
}

export const getFilteredUsers = (params: FilteredUsersParams): Promise<FilteredUsersResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.interests && params.interests.length > 0) queryParams.append('interests', params.interests.join(','));
  if (params.maxDistance) queryParams.append('maxDistance', params.maxDistance.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  
  // Add timestamp to prevent caching
  queryParams.append('_t', Date.now().toString());

  return api.get(`/api/users/filtered?${queryParams.toString()}`, {
    data: {
      currentUserLocation: params.currentUserLocation
    }
  }).then(response => response.data);
};

export const getFriendsCounts = (userIds: string[]): Promise<Record<string, number>> => {
  return api.post('/api/users/friends-counts', { userIds }).then(response => response.data);
};

export const getSuggestedUsers = (limit?: number): Promise<any[]> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());
  
  return api.get(`/api/users/suggested?${queryParams.toString()}`).then(response => response.data);
};

export const getPopularUsers = (limit?: number): Promise<any[]> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());
  
  return api.get(`/api/users/popular?${queryParams.toString()}`).then(response => response.data);
}; 