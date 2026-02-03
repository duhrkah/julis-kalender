/**
 * User table component for admin user management
 */
'use client';

import { User } from '@/types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  currentUserId?: number;
}

export default function UserTable({ users, onEdit, onDelete, currentUserId }: UserTableProps) {
  const handleDelete = (user: User) => {
    if (user.id === currentUserId) {
      alert('Sie können Ihren eigenen Account nicht löschen!');
      return;
    }

    if (confirm(`Möchten Sie den Benutzer "${user.username}" wirklich löschen?`)) {
      onDelete(user.id);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border border border-border rounded-lg">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Benutzername
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              E-Mail
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rolle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                Keine Benutzer gefunden
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {user.username}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-primary">(Sie)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user.full_name || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-julis-soft-purple text-foreground'
                        : 'bg-julis-soft-cyan text-foreground'
                    }`}
                  >
                    {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active
                        ? 'bg-julis-soft-cyan text-foreground'
                        : 'bg-destructive/20 text-destructive'
                    }`}
                  >
                    {user.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-primary hover:text-primary/80 mr-4"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-destructive hover:text-destructive/80"
                    disabled={user.id === currentUserId}
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
  );
}
