/**
 * User form component for creating and editing users
 */
'use client';

import { useState, useEffect } from 'react';
import { User, UserCreate, UserUpdate } from '@/types/user';

interface UserFormProps {
  user?: User; // If provided, form is in edit mode
  onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const isEditMode = !!user;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '',
    role: user?.role || 'user',
    is_active: user?.is_active ?? true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (isEditMode) {
        const updateData: UserUpdate = {};
        if (formData.username !== user.username) updateData.username = formData.username;
        if (formData.email !== user.email) updateData.email = formData.email;
        if (formData.full_name !== user.full_name) updateData.full_name = formData.full_name;
        if (formData.password) updateData.password = formData.password;
        if (formData.role !== user.role) updateData.role = formData.role as 'admin' | 'editor' | 'user';
        if (formData.is_active !== user.is_active) updateData.is_active = formData.is_active;

        await onSubmit(updateData);
      } else {
        if (!formData.password) {
          setFormError('Passwort ist erforderlich');
          return;
        }

        const createData: UserCreate = {
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name || undefined,
          password: formData.password,
          role: formData.role as 'admin' | 'user',
        };

        await onSubmit(createData);
      }
    } catch (err: any) {
      setFormError(err.message || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const inputClasses =
    'w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground disabled:opacity-50';
  const labelClasses = 'block text-sm font-medium mb-2 text-foreground';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-foreground">
        {isEditMode ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
      </h2>

      {/* Username - editable in create and edit (admin can change usernames) */}
      <div>
        <label htmlFor="username" className={labelClasses}>
          Benutzername *
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
          className={inputClasses}
          disabled={isLoading}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClasses}>
          E-Mail *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className={inputClasses}
          disabled={isLoading}
        />
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className={labelClasses}>
          Vollständiger Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange}
          className={inputClasses}
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className={labelClasses}>
          Passwort {isEditMode ? '(leer lassen, um nicht zu ändern)' : '*'}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required={!isEditMode}
          value={formData.password}
          onChange={handleChange}
          className={inputClasses}
          disabled={isLoading}
          placeholder={isEditMode ? '••••••••' : ''}
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className={labelClasses}>
          Rolle *
        </label>
        <select
          id="role"
          name="role"
          required
          value={formData.role}
          onChange={handleChange}
          className={inputClasses}
          disabled={isLoading}
        >
          <option value="user">Untergliederung</option>
          <option value="editor">Landesvorstand</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Active Status - only in edit mode */}
      {isEditMode && (
        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            disabled={isLoading}
          />
          <label htmlFor="is_active" className="ml-2 text-sm font-medium text-foreground">
            Benutzer ist aktiv
          </label>
        </div>
      )}

      {/* Error message */}
      {formError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
          {formError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Speichern...' : isEditMode ? 'Änderungen speichern' : 'Benutzer erstellen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-foreground bg-muted hover:bg-muted/80 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
