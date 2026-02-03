/**
 * User's events list (Meine Events)
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event } from '@/types/event';
import * as eventApi from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Edit2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function MyEventsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getMyEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({ title: t('common.error'), description: t('events.loadError'), variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(t('events.deleteConfirm', { title }))) return;
    try {
      setDeletingId(id);
      await eventApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: t('common.success'), description: t('events.deleted'), variant: 'success' });
    } catch (error) {
      toast({ title: t('common.error'), description: t('events.deleteError'), variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string, timeStr?: string | null) => {
    try {
      const d = new Date(dateStr);
      let s = format(d, 'dd. MMM yyyy', { locale: de });
      if (timeStr) s += ` ${timeStr.substring(0, 5)}`;
      return s;
    } catch {
      return dateStr;
    }
  };

  const statusLabel = (status: string) => {
    const key = status as 'pending' | 'approved' | 'rejected';
    return t(`events.status.${key}`);
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('breadcrumb.myEvents') },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('nav.myEvents')}</h2>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          {t('nav.newEvent')}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-card p-12 rounded-lg border border-border text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('events.emptyMyEvents')}</h3>
          <p className="text-muted-foreground mb-6">{t('events.emptyMyEventsDescription')}</p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            {t('nav.newEvent')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(event.start_date, event.start_time)}
                    {event.category && (
                      <span
                        className="ml-2 inline-flex px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: event.category.color + '30',
                          color: event.category.color,
                        }}
                      >
                        {event.category.name}
                      </span>
                    )}
                  </p>
                  {event.status === 'rejected' && event.rejection_reason && (
                    <p className="text-sm text-destructive mt-1">{event.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${statusClass(event.status)}`}>
                    {statusLabel(event.status)}
                  </span>
                  {event.status === 'pending' && (
                    <Link
                      href={`/dashboard/events/${event.id}/edit`}
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 size={18} />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    disabled={deletingId === event.id}
                    className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                    title={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
