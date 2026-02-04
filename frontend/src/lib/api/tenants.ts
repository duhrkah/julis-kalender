/**
 * Tenant API calls for multi-tenancy support
 */
import apiClient from './client';
import { Tenant, TenantPublic, TenantHierarchy, TenantCreate, TenantUpdate, TenantStats } from '@/types/tenant';

// ============== Public Endpoints ==============

/**
 * Get all active tenants (public)
 */
export const getPublicTenants = async (
  level?: string,
  parentId?: number
): Promise<TenantPublic[]> => {
  const params: Record<string, string | number> = {};
  if (level) params.level = level;
  if (parentId != null) params.parent_id = parentId;
  
  const { data } = await apiClient.get<TenantPublic[]>('/public/tenants', { params });
  return data;
};

/**
 * Get tenant by slug (public)
 */
export const getTenantBySlug = async (slug: string): Promise<TenantPublic> => {
  const { data } = await apiClient.get<TenantPublic>(`/tenants/public/${slug}`);
  return data;
};

/**
 * Get all Landesverbände (convenience function)
 */
export const getLandesverbaende = async (): Promise<TenantPublic[]> => {
  return getPublicTenants('landesverband');
};

/**
 * Get Bezirksverbände for a Landesverband
 */
export const getBezirksverbaende = async (landesverbandId: number): Promise<TenantPublic[]> => {
  return getPublicTenants('bezirksverband', landesverbandId);
};

// ============== Admin Endpoints ==============

/**
 * Get all tenants (admin)
 */
export const getAllTenants = async (
  level?: string,
  parentId?: number,
  activeOnly?: boolean
): Promise<Tenant[]> => {
  const params: Record<string, string | number | boolean> = {};
  if (level) params.level = level;
  if (parentId != null) params.parent_id = parentId;
  if (activeOnly != null) params.active_only = activeOnly;
  
  const { data } = await apiClient.get<Tenant[]>('/tenants', { params });
  return data;
};

/**
 * Get tenant by ID (admin)
 */
export const getTenant = async (id: number): Promise<Tenant> => {
  const { data } = await apiClient.get<Tenant>(`/tenants/${id}`);
  return data;
};

/**
 * Create a new tenant (admin)
 */
export const createTenant = async (tenant: TenantCreate): Promise<Tenant> => {
  const { data } = await apiClient.post<Tenant>('/tenants', tenant);
  return data;
};

/**
 * Update a tenant (admin)
 */
export const updateTenant = async (id: number, tenant: TenantUpdate): Promise<Tenant> => {
  const { data } = await apiClient.put<Tenant>(`/tenants/${id}`, tenant);
  return data;
};

/**
 * Delete a tenant (admin)
 */
export const deleteTenant = async (id: number): Promise<void> => {
  await apiClient.delete(`/tenants/${id}`);
};

/**
 * Get tenant statistics
 */
export const getTenantStats = async (tenantId: number): Promise<TenantStats> => {
  const { data } = await apiClient.get<TenantStats>(`/tenants/${tenantId}/stats`);
  return data;
};

/**
 * Get aggregated statistics for tenant and all children (admin)
 */
export const getAggregatedTenantStats = async (tenantId: number): Promise<TenantStats[]> => {
  const { data } = await apiClient.get<TenantStats[]>(`/tenants/${tenantId}/aggregated-stats`);
  return data;
};

// ============== Context Helpers ==============

/**
 * Set the current tenant context for API requests
 * This adds the X-Tenant-Slug header to subsequent requests
 */
export const setTenantContext = (slug: string | null) => {
  if (slug) {
    apiClient.defaults.headers.common['X-Tenant-Slug'] = slug;
  } else {
    delete apiClient.defaults.headers.common['X-Tenant-Slug'];
  }
};

/**
 * Get the current tenant context from API client
 */
export const getTenantContext = (): string | null => {
  return apiClient.defaults.headers.common['X-Tenant-Slug'] as string | null || null;
};

/**
 * Clear the tenant context
 */
export const clearTenantContext = () => {
  delete apiClient.defaults.headers.common['X-Tenant-Slug'];
};
