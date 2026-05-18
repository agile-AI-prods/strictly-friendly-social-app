import api from '../api/axiosInstance';
import type { User } from '../types';

export const authService = {
  async signUp(email: string, password: string, metadata?: { name: string }, recaptchaToken?: string) {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        name: metadata?.name || email.split('@')[0],
        recaptchaToken
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Signup failed');
    }
  },

  async signIn(email: string, password: string, recaptchaToken?: string) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        recaptchaToken
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  },

  async signInWithGoogle() {
    // Google OAuth is not yet implemented with MongoDB backend
    throw new Error('Google sign-in is not yet implemented. Please use email sign-in.');
  },

  async signOut() {
    try {
      // Clear the JWT cookie by calling logout endpoint
      await api.post('/auth/logout');
      
      // Clear any local storage or state
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/login';
    }
  },

  async getSession() {
    try {
      // Check if user is authenticated by calling a protected endpoint
      const response = await api.get('/auth/me');
      
      if (response.data && response.data.user) {
        return {
          user: response.data.user,
          access_token: 'authenticated' // JWT is stored in HTTP-only cookie
        };
      }
      
      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return null; // Not authenticated
      }
      throw error;
    }
  },

  async getUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data?.user || null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return null; // Not authenticated
      }
      throw error;
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Since we're not using Supabase realtime, we'll implement a simple polling mechanism
    // or use the existing Redux store for auth state changes
    
    // For now, return a cleanup function that does nothing
    return () => {
      // Cleanup function
    };
  },

  // Additional MongoDB-specific methods
  async checkEmail(email: string) {
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Email check failed');
    }
  },

  async resetPassword(email: string) {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password reset failed');
    }
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await api.put('/auth/update-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password update failed');
    }
  }
}; 