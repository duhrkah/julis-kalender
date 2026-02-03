/**
 * User dashboard page
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { getMyEventStats, type UserEventStats } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<UserEventStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyEventStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStatsError(t('events.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: t('breadcrumb.dashboard'), href: '/dashboard' }]} />

      {/* Welcome Section */}
      <div className="bg-card p-6 rounded-lg border border-border transition-shadow hover:shadow-md">
        <h2 className="text-2xl font-bold mb-2">
          {t('dashboard.welcome', { name: user?.full_name || user?.username || '' })}
        </h2>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/events/new"
          className="block p-6 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">+</span>
            </div>
            <h3 className="font-semibold">{t('dashboard.newEventTitle')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.newEventDescription')}
          </p>
        </Link>

        <Link
          href="/dashboard/events"
          className="block p-6 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">📋</span>
            </div>
            <h3 className="font-semibold">{t('dashboard.myEventsTitle')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.myEventsDescription')}
          </p>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="block p-6 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xl">⚙️</span>
              </div>
              <h3 className="font-semibold">{t('dashboard.adminTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.adminDescription')}
            </p>
          </Link>
        )}
      </div>

      {/* Meine Event-Statistik */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4">{t('dashboard.myEventsTitle')}</h3>
        {statsError && (
          <p className="text-sm text-destructive text-center mb-4">{statsError}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.total}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('events.statsTotal')}</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.pending}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('events.status.pending')}</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.approved}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('events.status.approved')}</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats === null ? '…' : stats.rejected}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('events.status.rejected')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
