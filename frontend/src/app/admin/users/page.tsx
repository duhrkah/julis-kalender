/**
 * User management page (Admin only)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, UserCreate, UserUpdate } from '@/types/user';
import * as userApi from '@/lib/api/users';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/components/ui/toast';
import UserForm from '@/components/forms/UserForm';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if not admin (editors cannot access user management)
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAdmin, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSubmit = async (data: UserCreate | UserUpdate) => {
    try {
      setFormLoading(true);

      if (editingUser) {
        await userApi.updateUser(editingUser.id, data as UserUpdate);
        toast({
          title: 'Erfolg',
          description: 'Benutzer wurde aktualisiert',
          variant: 'success',
        });
      } else {
        await userApi.createUser(data as UserCreate);
        toast({
          title: 'Erfolg',
          description: 'Benutzer wurde erstellt',
          variant: 'success',
        });
      }

      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ein Fehler ist aufgetreten';
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
      throw new Error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Fehler',
        description: 'Sie können Ihren eigenen Account nicht löschen!',
        variant: 'error',
      });
      return;
    }

    if (!confirm('Benutzer wirklich löschen?')) return;

    try {
      await userApi.deleteUser(userId);
      await loadUsers();
      toast({
        title: 'Erfolg',
        description: 'Benutzer wurde erfolgreich gelöscht',
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

  const handleToggleActive = async (user: User) => {
    try {
      await userApi.updateUser(user.id, { is_active: !user.is_active });
      await loadUsers();
      toast({
        title: 'Erfolg',
        description: `Benutzer wurde ${!user.is_active ? 'aktiviert' : 'deaktiviert'}`,
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Aktualisieren';
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
    setEditingUser(null);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Lade Benutzer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Benutzer-Verwaltung</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Erstellen und verwalten Sie Benutzer-Accounts
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            + Neuer Benutzer
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <UserForm
            user={editingUser || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={formLoading}
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Benutzername</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">E-Mail</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rolle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Erstellt</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Benutzer vorhanden.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.username}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-primary">(Sie)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{user.full_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin'
                          ? 'bg-julis-soft-purple text-foreground'
                          : user.role === 'editor'
                            ? 'bg-julis-soft-cyan text-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Landesvorstand' : 'Untergliederung'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        user.is_active
                          ? 'bg-julis-soft-cyan text-foreground hover:opacity-90'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {user.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.created_at
                      ? format(new Date(user.created_at), 'dd.MM.yyyy', { locale: de })
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                      disabled={user.id === currentUser?.id}
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
  );
}
