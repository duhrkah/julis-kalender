/**
 * User-related TypeScript types
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name?: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}
