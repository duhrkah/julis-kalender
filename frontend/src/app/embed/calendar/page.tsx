/**
 * Embeddable calendar view (minimal UI for iframe)
 * Supports URL params: category_id, lang, height
 */
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Event } from '@/types/event';
import * as eventApi from '@/lib/api/events';
import FullCalendarWrapper from '@/components/calendar/FullCalendarWrapper';
import EventModal from '@/components/calendar/EventModal';
function EmbedCalendarContent() {
  const searchParams = useSearchParams();
  const categoryId = useMemo(() => {
    const id = searchParams.get('category_id');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);
  const embedHeight = searchParams.get('height') || 'auto';

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [categoryId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getPublicEvents(categoryId);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Kalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <FullCalendarWrapper
        events={events}
        onEventClick={setSelectedEvent}
        height={embedHeight}
      />
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default function EmbedCalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <EmbedCalendarContent />
    </Suspense>
  );
}
