import api from './axiosInstance';

export const getFriendsBirthdays = (userId: string) =>
  api.get(`/api/birthdays/friends/${userId}`).then(res => res.data);

export const getFriendsBirthdaysForYear = (userId: string, year: number) =>
  api.get(`/api/birthdays/friends/${userId}/${year}`).then(res => res.data);

export const getUpcomingBirthdays = (userId: string) =>
  api.get(`/api/birthdays/upcoming/${userId}`).then(res => res.data);

export const getTodaysBirthdays = (userId: string) =>
  api.get(`/api/birthdays/today/${userId}`).then(res => res.data); 