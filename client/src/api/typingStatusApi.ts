import axiosInstance from './axiosInstance';

// Get typing status for a conversation
export const getTypingStatus = async (conversationId: string) => {
  try {
    const response = await axiosInstance.get(`/api/typing-status/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching typing status:', error);
    throw error;
  }
};

// Set typing status for a user in a conversation
export const setTypingStatus = async (conversationId: string, isTyping: boolean) => {
  try {
    const response = await axiosInstance.post(`/api/typing-status/conversation/${conversationId}`, {
      isTyping
    });
    return response.data;
  } catch (error) {
    console.error('Error setting typing status:', error);
    throw error;
  }
};

// Clear typing status for a user in a conversation
export const clearTypingStatus = async (conversationId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/typing-status/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error clearing typing status:', error);
    throw error;
  }
};

// Get all typing statuses for the current user
export const getUserTypingStatuses = async () => {
  try {
    const response = await axiosInstance.get('/api/typing-status/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user typing statuses:', error);
    throw error;
  }
};

// Clean up old typing statuses (admin function)
export const cleanupOldTypingStatuses = async () => {
  try {
    const response = await axiosInstance.post('/api/typing-status/cleanup');
    return response.data;
  } catch (error) {
    console.error('Error cleaning up old typing statuses:', error);
    throw error;
  }
};
