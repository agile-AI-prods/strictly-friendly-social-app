import { createProfile as createProfileApi, updateProfile as updateProfileApi, getProfile as getProfileApi, getAllProfiles as getAllProfilesApi, getFilteredProfiles as getFilteredProfilesApi, uploadProfilePhoto as uploadProfilePhotoApi } from '../api/profileApi';
import type { Profile, User } from '../types';

export const profileService = {
  async createProfile(userId: string, profileData: Partial<Profile>) {
    return await createProfileApi({
      id: userId,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },

  async updateProfile(userId: string, profileData: Partial<Profile>) {
    return await updateProfileApi(userId, {
      ...profileData,
      updated_at: new Date().toISOString()
    });
  },

  async getProfile(userId: string) {
    return await getProfileApi(userId);
  },

  async uploadProfilePhoto(userId: string, file: File) {
    const result = await uploadProfilePhotoApi(userId, file);
    // Server returns { photoUrl: "url_string" }
    return result;
  },

  async getProfileByEmail(email: string) {
    // This would need a new backend endpoint if needed
    // For now, we'll keep the existing implementation
    const profiles = await getAllProfilesApi();
    return profiles.find((profile: any) => profile.email === email) || null;
  },

  async getAllProfiles() {
    return await getAllProfilesApi();
  },

  async getFilteredProfiles(params: {
    currentUserId: string;
    searchTerm?: string;
    interests?: string[];
    maxDistance?: number;
    currentUserLocation?: { latitude: number; longitude: number };
    limit?: number;
    offset?: number;
  }) {
    return await getFilteredProfilesApi({
      searchTerm: params.searchTerm,
      interests: params.interests,
      maxDistance: params.maxDistance,
      currentUserLocation: params.currentUserLocation,
      limit: params.limit,
      offset: params.offset
    });
  },

  async getProfilesByLocation(latitude: number, longitude: number, maxDistance: number) {
    return await getFilteredProfilesApi({
      currentUserLocation: { latitude, longitude },
      maxDistance
    });
  },

  async getProfilesByInterests(interests: string[]) {
    return await getFilteredProfilesApi({
      interests
    });
  },

  async searchProfiles(searchTerm: string) {
    return await getFilteredProfilesApi({
      searchTerm
    });
  }
}; 