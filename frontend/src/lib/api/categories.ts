/**
 * Category API calls
 */
import apiClient from './client';
import { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

/**
 * Get all categories (Admin)
 */
export const getAllCategories = async (activeOnly: boolean = false): Promise<Category[]> => {
  const { data } = await apiClient.get<Category[]>('/admin/categories', {
    params: { active_only: activeOnly },
  });
  return data;
};

/**
 * Get category by ID (Admin)
 */
export const getCategory = async (id: number): Promise<Category> => {
  const { data } = await apiClient.get<Category>(`/admin/categories/${id}`);
  return data;
};

/**
 * Create new category (Admin)
 */
export const createCategory = async (category: CategoryCreate): Promise<Category> => {
  const { data } = await apiClient.post<Category>('/admin/categories', category);
  return data;
};

/**
 * Update category (Admin)
 */
export const updateCategory = async (
  id: number,
  category: CategoryUpdate
): Promise<Category> => {
  const { data} = await apiClient.put<Category>(`/admin/categories/${id}`, category);
  return data;
};

/**
 * Delete category (Admin)
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`);
};

/**
 * Get public categories (no auth required)
 */
export const getPublicCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get<Category[]>('/public/categories');
  return data;
};
