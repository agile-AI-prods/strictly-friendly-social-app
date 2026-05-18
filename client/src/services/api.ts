import  axios from 'axios';
import { User, Connection, Message } from '../types';

// Create API client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// USER OPERATIONS
export const usersAPI = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User | null> => {
    try {
      const response = await apiClient.post('/users', user);
      return response.data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User | null> => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data.user;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      return null;
    }
  }
};

// CONNECTION OPERATIONS
export const connectionsAPI = {
  getConnections: async (): Promise<Connection[]> => {
    try {
      const response = await apiClient.get('/connections');
      return response.data.connections || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  },

  createConnection: async (
    connection: Omit<Connection, 'id' | 'createdAt'>
  ): Promise<Connection | null> => {
    try {
      const response = await apiClient.post('/connections', connection);
      return response.data.connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      return null;
    }
  },

  updateConnection: async (
    connectionId: string, 
    status: Connection['status']
  ): Promise<Connection | null> => {
    try {
      const response = await apiClient.put(`/connections/${connectionId}`, { status });
      return response.data.connection;
    } catch (error) {
      console.error(`Error updating connection ${connectionId}:`, error);
      return null;
    }
  },

  deleteConnection: async (connectionId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/connections/${connectionId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting connection ${connectionId}:`, error);
      return false;
    }
  }
};

// MESSAGE OPERATIONS
export const messagesAPI = {
  getMessages: async (): Promise<Record<string, Message[]>> => {
    try {
      const response = await apiClient.get('/messages');
      return response.data.messages || {};
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {};
    }
  },

  createMessage: async (
    message: Omit<Message, 'id' | 'createdAt' | 'read'>
  ): Promise<Message | null> => {
    try {
      const response = await apiClient.post('/messages', message);
      return response.data.message;
    } catch (error) {
      console.error('Error creating message:', error);
      return null;
    }
  },

  markMessagesAsRead: async (messageIds: string[]): Promise<boolean> => {
    try {
      await apiClient.put('/messages/read', { messageIds });
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }
};
 