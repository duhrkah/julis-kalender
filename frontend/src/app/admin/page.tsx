/**
 * Admin dashboard overview page
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAdminStats, type AdminStats } from '@/lib/api/admin';

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStatsError('Statistiken konnten nicht geladen werden.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-2xl font-bold mb-2">Admin-Dashboard</h2>
        <p className="text-muted-foreground">
          Verwalten Sie Events, Kategorien und Benutzer
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Event Management */}
        <Link
          href="/admin/events"
          className="block p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">📅</span>
            </div>
            <h3 className="font-semibold">Event-Verwaltung</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Events genehmigen, ablehnen oder bearbeiten
          </p>
        </Link>

        {/* Category Management */}
        <Link
          href="/admin/categories"
          className="block p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">🏷️</span>
            </div>
            <h3 className="font-semibold">Kategorie-Verwaltung</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Event-Kategorien anlegen und verwalten
          </p>
        </Link>

        {/* User Management - Admin only */}
        {isAdmin && (
          <Link
            href="/admin/users"
            className="block p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xl">👥</span>
              </div>
              <h3 className="font-semibold">Benutzer-Verwaltung</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Benutzer erstellen und verwalten
            </p>
          </Link>
        )}

        {/* Audit Logs */}
        <Link
          href="/admin/audit"
          className="block p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">📝</span>
            </div>
            <h3 className="font-semibold">Audit-Logs</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin-Aktionen nachvollziehen
          </p>
        </Link>
      </div>

      {/* Statistics */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4">Statistiken</h3>
        {statsError && (
          <p className="text-sm text-destructive text-center mb-4">{statsError}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.pending_events}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Ausstehende Events</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.approved_events}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Genehmigte Events</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.rejected_events}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Abgelehnte Events</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.categories_count}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Kategorien</div>
          </div>
          {isAdmin && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {stats === null ? '…' : stats.users_count ?? '…'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Benutzer</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
