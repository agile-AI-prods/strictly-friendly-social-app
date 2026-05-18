import api from './axiosInstance';

export const addFriend = (friendId: string) =>
  api.post('/api/friends/add', { friendId }).then(res => res.data);

export const removeFriend = (friendId: string) =>
  api.delete(`/api/friends/${friendId}`).then(res => res.data);

export const getFriends = () =>
  api.get('/api/friends').then(res => res.data);

export const getFriendsList = (userId?: string) =>
  api.get(`/api/friends/list${userId ? `?userId=${userId}` : ''}`).then(res => res.data);

export const checkIsFriend = (friendId: string) =>
  api.get(`/api/friends/check/${friendId}`).then(res => res.data); 