/**
 * Category management page (Admin only)
 */
'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import * as categoryApi from '@/lib/api/categories';
import { useToast } from '@/components/ui/toast';

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    color: '#3B82F6',
    description: '',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAllCategories(false);
      setCategories(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Laden der Kategorien');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, formData);
        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde erfolgreich aktualisiert',
          variant: 'success',
        });
      } else {
        await categoryApi.createCategory(formData);
        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde erfolgreich erstellt',
          variant: 'success',
        });
      }

      await loadCategories();

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', color: '#3B82F6', description: '' });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Speichern';
      setError(errorMessage);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Kategorie wirklich löschen?')) return;

    try {
      await categoryApi.deleteCategory(id);
      await loadCategories();
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde erfolgreich gelöscht',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Löschen';
      setError(errorMessage);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3B82F6', description: '' });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Lade Kategorien...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kategorie-Verwaltung</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalten Sie Event-Kategorien mit individuellen Farben
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          + Neue Kategorie
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Farbe *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 border border-border rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? 'Aktualisieren' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Farbe</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Beschreibung</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Kategorien vorhanden. Erstellen Sie die erste Kategorie.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-muted-foreground">{category.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {category.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
