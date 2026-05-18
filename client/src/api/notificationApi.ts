import api from './axiosInstance';

export const fetchNotifications = () =>
  api.get('/api/notifications').then(res => res.data);

export const markNotificationAsRead = (notificationId: string) =>
  api.put(`/api/notifications/${notificationId}/read`).then(res => res.data);

export const markAllNotificationsAsRead = () =>
  api.put('/api/notifications/read-all').then(res => res.data);

export const deleteNotification = (notificationId: string) =>
  api.delete(`/api/notifications/${notificationId}`).then(res => res.data);

export const createNotification = (notification: any) =>
  api.post('/api/notifications', notification).then(res => res.data); 