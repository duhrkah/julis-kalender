/**
 * Category-related TypeScript types
 */

export interface Category {
  id: number;
  name: string;
  color: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  created_by: number;
}

export interface CategoryCreate {
  name: string;
  color: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
}
