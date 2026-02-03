/**
 * User API calls
 */
import apiClient from './client';
import { User, UserCreate, UserUpdate } from '@/types/user';

/**
 * Get all users (Admin)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await apiClient.get<User[]>('/users/admin/users');
  return data;
};

/**
 * Get user by ID (Admin)
 */
export const getUser = async (id: number): Promise<User> => {
  const { data } = await apiClient.get<User>(`/users/admin/users/${id}`);
  return data;
};

/**
 * Create user (Admin)
 */
export const createUser = async (user: UserCreate): Promise<User> => {
  const { data } = await apiClient.post<User>('/users/admin/users', user);
  return data;
};

/**
 * Update user (Admin)
 */
export const updateUser = async (id: number, user: UserUpdate): Promise<User> => {
  const { data } = await apiClient.put<User>(`/users/admin/users/${id}`, user);
  return data;
};

/**
 * Delete user (Admin)
 */
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/admin/users/${id}`);
};
