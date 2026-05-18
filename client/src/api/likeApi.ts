import api from "./axiosInstance";

export const likeItem = (targetId: string, targetType: string) =>
  api.post(`/api/likes/${targetId}/${targetType}`).then(res => res.data);

export const unlikeItem = (targetId: string, targetType: string) =>
  api.delete(`/api/likes/${targetId}/${targetType}`).then(res => res.data);

export const fetchLikesCount = (targetId: string, targetType: string) =>
  api.get(`/api/likes/${targetId}/${targetType}/count`).then(res => res.data.count);

export const checkLikeStatus = (targetId: string, targetType: string) =>
  api.get(`/api/likes/${targetId}/${targetType}/status`).then(res => res.data.liked);
