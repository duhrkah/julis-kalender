/**
 * New event submission page
 */
'use client';

import { useRouter } from 'next/navigation';
import EventForm from '@/components/forms/EventForm';
import * as eventApi from '@/lib/api/events';
import { EventCreate } from '@/types/event';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function NewEventPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (data: EventCreate) => {
    await eventApi.createEvent(data);
    toast({
      title: t('events.submitSuccess'),
      description: t('events.submitSuccessDescription'),
      variant: 'success',
    });
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t('breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('breadcrumb.myEvents'), href: '/dashboard/events' },
          { label: t('breadcrumb.newEvent') },
        ]}
      />
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('dashboard.newEventTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard.newEventDescription')}
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <EventForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard')}
          submitLabel={t('common.submit')}
        />
      </div>
    </div>
  );
}
