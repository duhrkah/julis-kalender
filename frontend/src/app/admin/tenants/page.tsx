'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Tenant, TenantCreate, TenantUpdate, getTenantLevelDisplayName } from '@/types/tenant';
import { getAllTenants, createTenant, updateTenant, deleteTenant, getTenantStats } from '@/lib/api/tenants';

export default function TenantsAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantCreate>({
    name: '',
    slug: '',
    level: 'landesverband',
    parent_id: null,
  });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  // Fetch tenants
  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllTenants();
      setTenants(data);
    } catch (err) {
      setError('Fehler beim Laden der Verbände');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTenants();
    }
  }, [user]);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, formData as TenantUpdate);
      } else {
        await createTenant(formData);
      }
      setShowCreateModal(false);
      setEditingTenant(null);
      setFormData({ name: '', slug: '', level: 'landesverband', parent_id: null });
      await fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Speichern');
    }
  };

  // Handle delete
  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Möchten Sie "${tenant.name}" wirklich löschen?`)) return;
    
    try {
      await deleteTenant(tenant.id);
      await fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Löschen');
    }
  };

  // Open edit modal
  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description || undefined,
      level: tenant.level,
      parent_id: tenant.parent_id,
      logo_url: tenant.logo_url || undefined,
      primary_color: tenant.primary_color || undefined,
    });
    setShowCreateModal(true);
  };

  // Group tenants by hierarchy
  const bundesverband = tenants.find(t => t.level === 'bundesverband');
  const landesverbaende = tenants.filter(t => t.level === 'landesverband');
  const bezirksverbaende = tenants.filter(t => t.level === 'bezirksverband');

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verbandsverwaltung
        </h1>
        <button
          onClick={() => {
            setEditingTenant(null);
            setFormData({ name: '', slug: '', level: 'landesverband', parent_id: null });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Neuer Verband
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Bundesverband Section */}
      {bundesverband && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-yellow-600 dark:text-yellow-400">
            Bundesverband
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {bundesverband.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {bundesverband.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      bundesverband.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {bundesverband.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(bundesverband)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Landesverbände Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
          Landesverbände ({landesverbaende.length})
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {landesverbaende.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Keine Landesverbände vorhanden
                  </td>
                </tr>
              ) : (
                landesverbaende.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tenant.primary_color && (
                          <span 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tenant.primary_color }}
                          />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {tenant.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {tenant.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tenant.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(tenant)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(tenant)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingTenant ? 'Verband bearbeiten' : 'Neuer Verband'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name,
                      slug: editingTenant ? prev.slug : generateSlug(name),
                    }));
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="z.B. JuLis Bayern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="z.B. bayern"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nur Kleinbuchstaben, Zahlen und Bindestriche
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ebene *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    level: e.target.value as any,
                    parent_id: e.target.value === 'bundesverband' ? null : prev.parent_id,
                  }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bundesverband">Bundesverband</option>
                  <option value="landesverband">Landesverband</option>
                  <option value="bezirksverband">Bezirks-/Kreisverband</option>
                </select>
              </div>

              {formData.level !== 'bundesverband' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Übergeordneter Verband
                  </label>
                  <select
                    value={formData.parent_id ?? ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      parent_id: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                             rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Keiner (Bundesebene)</option>
                    {formData.level === 'landesverband' && bundesverband && (
                      <option value={bundesverband.id}>{bundesverband.name}</option>
                    )}
                    {formData.level === 'bezirksverband' && landesverbaende.map(lv => (
                      <option key={lv.id} value={lv.id}>{lv.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primärfarbe
                </label>
                <input
                  type="color"
                  value={formData.primary_color || '#3B82F6'}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-full h-10 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optionale Beschreibung..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTenant(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                           dark:hover:bg-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTenant ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
