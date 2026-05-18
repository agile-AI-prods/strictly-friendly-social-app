import api from './axiosInstance';

export const fetchConnectedConnections = () =>
  api.get('/api/connections/connected').then(res => res.data);

export const fetchPendingConnections = () =>
  api.get('/api/connections/pending').then(res => res.data);

export const fetchSentConnections = () =>
  api.get('/api/connections/sent').then(res => res.data);

export const fetchRejectedConnections = () =>
  api.get('/api/connections/rejected').then(res => res.data);

export const fetchUserConnectedConnections = (userId: string) =>
  api.get(`/api/connections/user/${userId}/connected`).then(res => res.data);

export const fetchConnectionStatuses = (userIds: string[]) =>
  api.get(`/api/connections/statuses?userIds=${userIds.join(',')}`).then(res => res.data);

export const sendConnectionRequest = (receiverId: string) =>
  api.post('/api/connections/send', { receiverId }).then(res => res.data);

export const acceptConnectionRequest = (connectionId: string) =>
  api.put(`/api/connections/accept/${connectionId}`).then(res => res.data);

export const rejectConnectionRequest = (connectionId: string) =>
  api.put(`/api/connections/reject/${connectionId}`).then(res => res.data);

export const removeConnection = (connectionId: string) =>
  api.delete(`/api/connections/${connectionId}`).then(res => res.data);

export const getFriendsCount = (userId: string) =>
  api.get(`/api/connections/${userId}/friends/count`).then(res => res.data.count); 