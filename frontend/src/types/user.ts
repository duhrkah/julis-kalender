/**
 * User-related TypeScript types
 */

export type UserRole = 'admin' | 'editor' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  is_active: boolean;
  tenant_id?: number | null;  // Multi-tenancy: Verband the user belongs to
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name?: string;
  password: string;
  role?: UserRole;
  tenant_id?: number;  // Multi-tenancy: Verband the user should be assigned to
}

export interface UserUpdate {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
  tenant_id?: number;  // Multi-tenancy: Verband the user should be assigned to
}
