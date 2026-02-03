/**
 * Event detail modal component
 */
'use client';

import { useEffect } from 'react';
import { Event } from '@/types/event';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { Calendar, Download } from 'lucide-react';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
}

function formatIcalDateTime(dateStr: string, timeStr?: string | null): string {
  const date = new Date(dateStr);
  const datePart = format(date, 'yyyyMMdd');
  if (timeStr) {
    const [h, m] = timeStr.substring(0, 5).split(':');
    return datePart + 'T' + (h || '00').padStart(2, '0') + (m || '00').padStart(2, '0') + '00';
  }
  return datePart + 'T000000';
}

function buildIcalContent(event: Event): string {
  const start = formatIcalDateTime(event.start_date, event.start_time);
  let end: string;
  if (event.end_date) {
    end = formatIcalDateTime(event.end_date, event.end_time);
  } else if (event.start_time) {
    const startDate = new Date(event.start_date + 'T' + event.start_time);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    end = format(endDate, "yyyyMMdd'T'HHmmss");
  } else {
    const startDate = new Date(event.start_date + 'T00:00:00');
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    end = format(endDate, "yyyyMMdd'T'HHmmss");
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JuLis Kalender//DE',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@kalender.local`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
  ];
  if (event.organizer) {
    const cn = event.organizer.replace(/["\\]/g, '\\$&');
    lines.push(`ORGANIZER;CN="${cn}":mailto:noreply@kalender.local`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
  }
  if (event.location) {
    // iCal TEXT: Komma, Semikolon, Backslash und Zeilenumbruch escapen (RFC 5545)
    let loc = event.location;
    if (event.location_url) loc += '\n' + event.location_url;
    const escaped = loc.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    lines.push(`LOCATION:${escaped}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadIcal(event: Event) {
  const content = buildIcalContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\-]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildGoogleCalendarUrl(event: Event): string {
  const start = new Date(event.start_date + (event.start_time ? `T${event.start_time}` : ''));
  const end = event.end_date
    ? new Date(event.end_date + (event.end_time ? `T${event.end_time}` : ''))
    : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${format(start, "yyyyMMdd'T'HHmmss")}/${format(end, "yyyyMMdd'T'HHmmss")}`,
  });
  if (event.location) params.set('location', event.location);
  if (event.description) params.set('details', event.description);
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!event) return null;

  const formatDateTime = (dateStr: string, timeStr?: string | null) => {
    try {
      const date = new Date(dateStr);
      let result = format(date, 'EEEE, dd. MMMM yyyy', { locale: de });
      if (timeStr) {
        result += ` um ${timeStr.substring(0, 5)} Uhr`;
      }
      return result;
    } catch {
      return dateStr;
    }
  };

  const googleUrl = buildGoogleCalendarUrl(event);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card max-w-2xl w-full rounded-lg shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        {/* Header with category color */}
        {event.category && (
          <div
            className="h-2 rounded-t-lg"
            style={{ backgroundColor: event.category.color }}
          />
        )}

        <div className="p-6">
          {/* Title, Organizer and Category */}
          <div className="mb-4">
            <h2 id="event-modal-title" className="text-2xl font-bold mb-2">
              {event.title}
            </h2>
            {event.organizer && (
              <p className="text-sm text-muted-foreground mb-2">
                {t('events.organizer')}: {event.organizer}
              </p>
            )}
            {event.category && (
              <span
                className="inline-flex px-3 py-1 text-sm rounded-full"
                style={{
                  backgroundColor: event.category.color + '20',
                  color: event.category.color,
                }}
              >
                {event.category.name}
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                {t('events.modalDescription')}
              </h3>
              <p className="text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Date/Time */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              {t('events.modalDateTime')}
            </h3>
            <div className="text-sm">
              <div>
                <span className="font-medium">Start:</span>{' '}
                {formatDateTime(event.start_date, event.start_time)}
              </div>
              {event.end_date && (
                <div>
                  <span className="font-medium">Ende:</span>{' '}
                  {formatDateTime(event.end_date, event.end_time)}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                {t('events.modalLocation')}
              </h3>
              <div className="text-sm">
                {event.location_url ? (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {event.location} →
                  </a>
                ) : (
                  event.location
                )}
              </div>
            </div>
          )}

          {/* Add to Calendar */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              {t('events.addToCalendar')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
              >
                <Calendar size={16} />
                Google Kalender
              </a>
              <button
                type="button"
                onClick={() => downloadIcal(event)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
              >
                <Download size={16} />
                {t('events.downloadIcal')}
              </button>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('events.modalClose')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
