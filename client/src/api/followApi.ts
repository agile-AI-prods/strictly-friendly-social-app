import api from "./axiosInstance";

export const followUser = (followedId: string) =>
  api.post(`/api/follows/${followedId}`).then(res => res.data);

export const unfollowUser = (followedId: string) =>
  api.delete(`/api/follows/${followedId}`).then(res => res.data);

export const fetchFollowingCount = (userId: string) =>
  api.get(`/api/follows/${userId}/following/count`).then(res => res.data.count);

export const fetchFollowersCount = (userId: string) =>
  api.get(`/api/follows/${userId}/followers/count`).then(res => res.data.count);

export const isFollowing = (followedId: string) =>
  api.get(`/api/follows/${followedId}/is-following`).then(res => res.data.isFollowing);

export const getFollowers = (userId: string) =>
  api.get(`/api/follows/${userId}/followers`).then(res => res.data);

export const getFollowing = (userId: string) =>
  api.get(`/api/follows/${userId}/following`).then(res => res.data);
