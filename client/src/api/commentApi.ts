import api from './axiosInstance';

export const fetchComments = (activityId: string) => 
  api.get(`/api/comments?activityId=${activityId}`).then(res => res.data);

export const createComment = (activityId: string, content: string) => 
  api.post('/api/comments', { activityId, content }).then(res => res.data);

export const updateComment = (commentId: string, content: string) => 
  api.put(`/api/comments/${commentId}`, { content }).then(res => res.data);

export const deleteComment = (commentId: string) => 
  api.delete(`/api/comments/${commentId}`).then(res => res.data); 