/**
 * Embeddable list view (minimal UI for iframe)
 */
'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import * as eventApi from '@/lib/api/events';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EmbedListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getPublicEvents();
      const sorted = data.sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      setEvents(sorted);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string, timeStr?: string | null) => {
    try {
      const date = new Date(dateStr);
      let result = format(date, 'dd.MM.yyyy', { locale: de });
      if (timeStr) {
        result += ` • ${timeStr.substring(0, 5)} Uhr`;
      }
      return result;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Keine Events vorhanden.
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            {/* Date Badge */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: event.category?.color || '#3B82F6',
                  }}
                >
                  <div className="text-xs uppercase">
                    {format(new Date(event.start_date), 'MMM', { locale: de })}
                  </div>
                  <div className="text-2xl">
                    {format(new Date(event.start_date), 'dd')}
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate">{event.title}</h3>

                <div className="text-sm text-muted-foreground space-y-1">
                  {event.organizer && (
                    <div className="font-medium">{event.organizer}</div>
                  )}
                  <div>{formatDate(event.start_date, event.start_time)}</div>

                  {event.location && (
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      {event.location_url ? (
                        <a
                          href={event.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {event.location}
                        </a>
                      ) : (
                        event.location
                      )}
                    </div>
                  )}

                  {event.category && (
                    <div>
                      <span
                        className="inline-flex px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: event.category.color + '20',
                          color: event.category.color,
                        }}
                      >
                        {event.category.name}
                      </span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
