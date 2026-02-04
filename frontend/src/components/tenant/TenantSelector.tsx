'use client';

import React from 'react';
import { useTenant } from '@/lib/hooks/useTenant';
import { getTenantLevelDisplayName } from '@/types/tenant';

interface TenantSelectorProps {
  /** Show all tenants or only Landesverbände */
  showAll?: boolean;
  /** Include "Alle Verbände" option */
  showAllOption?: boolean;
  /** Custom label */
  label?: string;
  /** CSS classes for the container */
  className?: string;
  /** Callback when tenant changes */
  onChange?: (tenantId: number | null) => void;
}

/**
 * Dropdown component for selecting a tenant (Verband)
 */
export function TenantSelector({
  showAll = false,
  showAllOption = true,
  label = 'Verband',
  className = '',
  onChange,
}: TenantSelectorProps) {
  const { currentTenant, tenants, landesverbaende, isLoading, selectTenant } = useTenant();

  const displayTenants = showAll ? tenants : landesverbaende;

  // Group tenants by level for better display
  const bundesverband = tenants.find(t => t.level === 'bundesverband');
  const groupedTenants = showAll
    ? [
        { label: 'Bundesebene', tenants: bundesverband ? [bundesverband] : [] },
        { label: 'Landesverbände', tenants: landesverbaende },
      ]
    : [{ label: 'Landesverbände', tenants: landesverbaende }];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const tenantId = value === '' ? null : parseInt(value, 10);
    selectTenant(tenantId);
    onChange?.(tenantId);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-9 w-48 rounded-md" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label 
        htmlFor="tenant-selector"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id="tenant-selector"
        value={currentTenant?.id ?? ''}
        onChange={handleChange}
        className="block w-full max-w-xs rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 px-3 py-2 text-sm
                   shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                   dark:text-white"
      >
        {showAllOption && (
          <option value="">Alle Verbände</option>
        )}
        {showAll ? (
          // Grouped display
          groupedTenants.map((group) => (
            group.tenants.length > 0 && (
              <optgroup key={group.label} label={group.label}>
                {group.tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </optgroup>
            )
          ))
        ) : (
          // Simple list
          displayTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

/**
 * Compact tenant badge showing current selection
 */
export function TenantBadge({ className = '' }: { className?: string }) {
  const { currentTenant } = useTenant();

  if (!currentTenant) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                       bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ${className}`}>
        Alle Verbände
      </span>
    );
  }

  const levelColors: Record<string, string> = {
    bundesverband: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    landesverband: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    bezirksverband: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                 ${levelColors[currentTenant.level] || 'bg-gray-100 text-gray-800'} ${className}`}
      style={currentTenant.primary_color ? { 
        backgroundColor: `${currentTenant.primary_color}20`,
        color: currentTenant.primary_color 
      } : undefined}
    >
      {currentTenant.name}
    </span>
  );
}

/**
 * Tenant info display component
 */
export function TenantInfo({ className = '' }: { className?: string }) {
  const { currentTenant, canSeeAllTenants } = useTenant();

  return (
    <div className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {currentTenant ? (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-900 dark:text-white">
            {currentTenant.name}
          </span>
          <span className="text-xs">
            {getTenantLevelDisplayName(currentTenant.level)}
          </span>
          {canSeeAllTenants && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Aggregierte Ansicht aller Verbände
            </span>
          )}
        </div>
      ) : (
        <span>Alle Verbände (Bundesebene)</span>
      )}
    </div>
  );
}

export default TenantSelector;
