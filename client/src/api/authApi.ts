import api from './axiosInstance';

export const login = async (email: string, password: string, recaptchaToken: string) => {
  return api.post('/api/auth/login', { 
    email, 
    password, 
    recaptchaToken
  });
};

export const signup = (email: string, password: string, name: string, recaptchaToken: string) =>
  api.post('/api/auth/signup', { email, password, name, recaptchaToken });

export const checkEmail = (email: string) =>
  api.post('/api/auth/check-email', { email });

export const forgotPassword = (email: string, recaptchaToken: string) =>
  api.post('/api/auth/forgot-password', { email, recaptchaToken });

export const resetPassword = (email: string, password: string, confirmPassword: string) =>
  api.post('/api/auth/reset-password', { email, password, confirmPassword });

export const logout = () =>
  api.post('/api/auth/logout'); 