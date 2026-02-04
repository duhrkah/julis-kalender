'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TenantPublic, TenantLevel } from '@/types/tenant';
import { getPublicTenants, getTenantBySlug, setTenantContext, clearTenantContext } from '@/lib/api/tenants';

interface TenantContextValue {
  /** Currently selected tenant */
  currentTenant: TenantPublic | null;
  /** All available tenants */
  tenants: TenantPublic[];
  /** Landesverbände only */
  landesverbaende: TenantPublic[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Select a tenant by ID */
  selectTenant: (tenantId: number | null) => void;
  /** Select a tenant by slug */
  selectTenantBySlug: (slug: string | null) => Promise<void>;
  /** Check if current user/tenant can see all tenants (Bundesverband) */
  canSeeAllTenants: boolean;
  /** Refresh tenants list */
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  /** Initial tenant slug from URL or config */
  initialSlug?: string | null;
}

export function TenantProvider({ children, initialSlug }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<TenantPublic | null>(null);
  const [tenants, setTenants] = useState<TenantPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tenants on mount
  const refreshTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPublicTenants();
      setTenants(data);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError('Fehler beim Laden der Verbände');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  // Set initial tenant from slug
  useEffect(() => {
    if (initialSlug && tenants.length > 0) {
      const tenant = tenants.find(t => t.slug === initialSlug);
      if (tenant) {
        setCurrentTenant(tenant);
        setTenantContext(tenant.slug);
      }
    }
  }, [initialSlug, tenants]);

  // Select tenant by ID
  const selectTenant = useCallback((tenantId: number | null) => {
    if (tenantId === null) {
      setCurrentTenant(null);
      clearTenantContext();
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      setTenantContext(tenant.slug);
    }
  }, [tenants]);

  // Select tenant by slug
  const selectTenantBySlug = useCallback(async (slug: string | null) => {
    if (slug === null) {
      setCurrentTenant(null);
      clearTenantContext();
      return;
    }

    // First check local cache
    let tenant = tenants.find(t => t.slug === slug);
    
    if (!tenant) {
      // Fetch from API if not in cache
      try {
        tenant = await getTenantBySlug(slug);
      } catch (err) {
        console.error('Failed to fetch tenant by slug:', err);
        return;
      }
    }

    if (tenant) {
      setCurrentTenant(tenant);
      setTenantContext(tenant.slug);
    }
  }, [tenants]);

  // Filter Landesverbände
  const landesverbaende = tenants.filter(t => t.level === 'landesverband');

  // Check if current tenant is Bundesverband (can see all)
  const canSeeAllTenants = currentTenant?.level === 'bundesverband' || currentTenant === null;

  const value: TenantContextValue = {
    currentTenant,
    tenants,
    landesverbaende,
    isLoading,
    error,
    selectTenant,
    selectTenantBySlug,
    canSeeAllTenants,
    refreshTenants,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook to get current tenant ID for API calls
 */
export function useCurrentTenantId(): number | null {
  const { currentTenant } = useTenant();
  return currentTenant?.id ?? null;
}

export default TenantProvider;
