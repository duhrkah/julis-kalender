/**
 * Authentication API calls
 */
import apiClient from './client';
import { LoginRequest, LoginResponse, Token } from '@/types/api';
import { User } from '@/types/user';

/**
 * Login with username and password
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // OAuth2 password flow requires form data
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const { data } = await apiClient.post<LoginResponse>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return data;
};

/**
 * Logout (client-side token deletion)
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Ignore errors on logout
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<Token> => {
  const { data } = await apiClient.post<Token>('/auth/refresh');
  return data;
};
