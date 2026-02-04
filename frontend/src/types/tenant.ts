/**
 * Tenant types for multi-tenancy support
 */

export type TenantLevel = 'bundesverband' | 'landesverband' | 'bezirksverband';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  level: TenantLevel;
  parent_id?: number | null;
  is_active: boolean;
  logo_url?: string | null;
  primary_color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantPublic {
  id: number;
  name: string;
  slug: string;
  level: TenantLevel;
  parent_id?: number | null;
  logo_url?: string | null;
  primary_color?: string | null;
}

export interface TenantHierarchy extends TenantPublic {
  children: TenantHierarchy[];
}

export interface TenantCreate {
  name: string;
  slug: string;
  description?: string;
  level?: TenantLevel;
  parent_id?: number | null;
  logo_url?: string;
  primary_color?: string;
}

export interface TenantUpdate {
  name?: string;
  slug?: string;
  description?: string;
  level?: TenantLevel;
  parent_id?: number | null;
  is_active?: boolean;
  logo_url?: string;
  primary_color?: string;
}

export interface TenantStats {
  tenant_id: number;
  tenant_name: string;
  total_events: number;
  pending_events: number;
  approved_events: number;
  rejected_events: number;
  total_users: number;
  total_categories: number;
}

/**
 * Helper to get display name for tenant level
 */
export function getTenantLevelDisplayName(level: TenantLevel): string {
  switch (level) {
    case 'bundesverband':
      return 'Bundesverband';
    case 'landesverband':
      return 'Landesverband';
    case 'bezirksverband':
      return 'Bezirks-/Kreisverband';
    default:
      return level;
  }
}

/**
 * Check if a tenant level can see all tenants
 */
export function canSeeAllTenants(level: TenantLevel): boolean {
  return level === 'bundesverband';
}
