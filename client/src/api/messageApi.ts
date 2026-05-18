import api from './axiosInstance';
import { Message } from '../types';

export interface ConnectedUser {
  userId: string;
  userName: string;
  photo_url: string;
  lastMessageTime: string;
  lastMessage: string;
  unReadCount: number;
}

export const fetchConnectedUsers = (): Promise<ConnectedUser[]> => {
  return api.get('/api/messages/connected-users').then(res => res.data);
};

export const loadMessages = (userId: string, page = 1, limit = 50): Promise<{ userId: string, messages: Message[], hasMore: boolean, page: number }> => {
  return api.get(`/api/messages/conversation/${userId}?page=${page}&limit=${limit}`).then(res => res.data);
};

export const markAsRead = (userId: string): Promise<any> => {
  return api.patch(`/api/messages/mark-as-read/${userId}`).then(res => res.data);
};

export const sendMessage = (receiverId: string, content: string, imageUrl?: string) =>
  api.post('/api/messages', { receiver_id: receiverId, content, imageUrl }).then(res => res.data);

export const uploadImage = (file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/api/messages/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};

export const deleteMessage = (messageId: string) =>
  api.delete(`/api/messages/${messageId}`).then(res => res.data);

export const editMessage = (messageId: string, content: string) =>
  api.put(`/api/messages/${messageId}`, { content }).then(res => res.data);

export const fetchUnreadMessageCounts = () =>
  api.get('/api/messages/unread-counts').then(res => res.data); 