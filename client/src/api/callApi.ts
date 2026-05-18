import axiosInstance from './axiosInstance';

// Create a new call
export const createCall = async (callData: {
  receiver_id: string;
  call_type?: 'voice' | 'video';
  status?: string;
}) => {
  try {
    const response = await axiosInstance.post('/api/calls', callData);
    return response.data;
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
};

// Get call by ID
export const getCallById = async (callId: string) => {
  try {
    const response = await axiosInstance.get(`/api/calls/${callId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching call:', error);
    throw error;
  }
};

// Update call status
export const updateCallStatus = async (callId: string, updates: {
  status?: string;
  answered_at?: string;
  [key: string]: any;
}) => {
  try {
    const response = await axiosInstance.put(`/api/calls/${callId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
};

// Get user's calls
export const getUserCalls = async (limit?: number) => {
  try {
    const params = limit ? { limit } : {};
    const response = await axiosInstance.get('/api/calls/user/calls', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user calls:', error);
    throw error;
  }
};

// Get recent calls between two users
export const getRecentCallsBetweenUsers = async (otherUserId: string, limit?: number) => {
  try {
    const params = limit ? { limit } : {};
    const response = await axiosInstance.get(`/api/calls/recent/${otherUserId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent calls between users:', error);
    throw error;
  }
};

// End a call
export const endCall = async (callId: string, endReason?: string) => {
  try {
    const response = await axiosInstance.delete(`/api/calls/${callId}`, {
      data: { endReason }
    });
    return response.data;
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
};

// Get call statistics for user
export const getCallStats = async () => {
  try {
    const response = await axiosInstance.get('/api/calls/stats/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching call stats:', error);
    throw error;
  }
};
