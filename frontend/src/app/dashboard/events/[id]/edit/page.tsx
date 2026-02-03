/**
 * Edit event page (only for pending events)
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EventForm from '@/components/forms/EventForm';
import * as eventApi from '@/lib/api/events';
import { EventCreate } from '@/types/event';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<EventCreate> | null>(null);

  const eventId = Number(params.id);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId || isNaN(eventId)) {
      router.push('/dashboard/events');
      return;
    }
    try {
      setLoading(true);
      const event = await eventApi.getEvent(eventId);
      if (event.status !== 'pending') {
        toast({ title: t('common.error'), description: t('events.saveError'), variant: 'error' });
        router.push('/dashboard/events');
        return;
      }
      setInitialData({
        title: event.title,
        organizer: event.organizer || '',
        description: event.description || '',
        start_date: event.start_date,
        start_time: event.start_time || '',
        end_date: event.end_date || '',
        end_time: event.end_time || '',
        location: event.location || '',
        location_url: event.location_url || '',
        category_id: event.category?.id,
        submitter_name: event.submitter_name || '',
        submitter_email: event.submitter_email || '',
        is_public: event.is_public,
      });
    } catch (error) {
      toast({ title: t('common.error'), description: t('events.loadError'), variant: 'error' });
      router.push('/dashboard/events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: EventCreate) => {
    await eventApi.updateEvent(eventId, data);
    toast({
      title: t('common.success'),
      description: t('events.submitSuccessDescription'),
      variant: 'success',
    });
    router.push('/dashboard/events');
  };

  if (loading || !initialData) {
    return (
      <div className="max-w-3xl">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t('breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('breadcrumb.myEvents'), href: '/dashboard/events' },
          { label: t('breadcrumb.editEvent') },
        ]}
      />
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('events.editEvent')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('events.editDescription')}
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <EventForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard/events')}
          submitLabel={t('common.save')}
        />
      </div>
    </div>
  );
}
