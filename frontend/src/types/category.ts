/**
 * Category-related TypeScript types
 */

export interface Category {
  id: number;
  name: string;
  color: string;
  description?: string | null;
  is_active: boolean;
  is_global?: boolean;  // Multi-tenancy: Global categories are visible to all tenants
  tenant_id?: number | null;  // Multi-tenancy: Verband the category belongs to
  created_at: string;
  created_by: number;
}

export interface CategoryCreate {
  name: string;
  color: string;
  description?: string;
  is_global?: boolean;  // Multi-tenancy: Make category visible to all tenants
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  is_global?: boolean;  // Multi-tenancy: Change global visibility
}
