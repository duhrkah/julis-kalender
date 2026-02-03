/**
 * FullCalendar wrapper component with responsive design and dark mode support
 */
'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { Event } from '@/types/event';

interface FullCalendarWrapperProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  initialView?: 'dayGridMonth' | 'listMonth';
  height?: string | number;
}

export default function FullCalendarWrapper({
  events,
  onEventClick,
  initialView = 'dayGridMonth',
  height = 'auto',
}: FullCalendarWrapperProps) {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const transformed = events.map((event) => {
      const startDateTime = event.start_time
        ? `${event.start_date}T${event.start_time}`
        : event.start_date;

      const endDateTime = event.end_date
        ? event.end_time
          ? `${event.end_date}T${event.end_time}`
          : event.end_date
        : event.start_time
        ? `${event.start_date}T${event.start_time}`
        : event.start_date;

      return {
        id: event.id.toString(),
        title: event.title,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: event.category?.color || '#E6007E',
        borderColor: event.category?.color || '#E6007E',
        extendedProps: {
          description: event.description,
          location: event.location,
          location_url: event.location_url,
          category: event.category,
          originalEvent: event,
        },
      };
    });

    setCalendarEvents(transformed);
  }, [events]);

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps.originalEvent);
    }
  };

  const headerToolbar = isMobile
    ? {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,listMonth',
      }
    : {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listMonth',
      };

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView={isMobile ? 'listMonth' : initialView}
        headerToolbar={headerToolbar}
        buttonText={{
          today: 'Heute',
          month: 'Monat',
          list: 'Liste',
        }}
        locale={deLocale}
        events={calendarEvents}
        eventClick={handleEventClick}
        height={isMobile ? 'auto' : height}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        displayEventTime={true}
        eventDisplay="block"
        dayMaxEvents={isMobile ? 2 : 3}
        moreLinkText={(n) => `+${n}`}
        titleFormat={isMobile ? { month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' }}
      />

      <style jsx global>{`
        .fullcalendar-wrapper {
          background: hsl(var(--card));
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
        }

        @media (min-width: 640px) {
          .fullcalendar-wrapper {
            padding: 1rem;
          }
        }

        .fc {
          font-family: inherit;
        }

        /* Toolbar styling */
        .fc .fc-toolbar {
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        @media (min-width: 640px) {
          .fc .fc-toolbar-title {
            font-size: 1.25rem;
          }
        }

        /* Button styling */
        .fc .fc-button {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: white;
          text-transform: none;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        @media (min-width: 640px) {
          .fc .fc-button {
            padding: 0.5rem 1rem;
          }
        }

        .fc .fc-button:hover:not(:disabled) {
          background-color: hsl(var(--primary) / 0.9);
          border-color: hsl(var(--primary) / 0.9);
        }

        .fc .fc-button:focus {
          box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary) / 0.5);
        }

        .fc .fc-button:disabled {
          opacity: 0.5;
        }

        .fc .fc-button-active {
          background-color: hsl(var(--primary) / 0.8) !important;
        }

        /* Table and cell styling */
        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border));
        }

        .fc .fc-col-header-cell {
          background-color: hsl(var(--muted));
          padding: 0.5rem;
        }

        .fc .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          font-size: 0.75rem;
        }

        @media (min-width: 640px) {
          .fc .fc-col-header-cell-cushion {
            font-size: 0.875rem;
          }
        }

        .fc .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          padding: 0.25rem 0.5rem;
        }

        .fc-day-today {
          background-color: hsl(var(--primary) / 0.05) !important;
        }

        .fc-day-today .fc-daygrid-day-number {
          background-color: hsl(var(--primary));
          color: white;
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Event styling */
        .fc-event {
          cursor: pointer;
          border-radius: 0.25rem;
          padding: 2px 4px;
          font-size: 0.75rem;
        }

        @media (min-width: 640px) {
          .fc-event {
            font-size: 0.8125rem;
          }
        }

        .fc-event:hover {
          opacity: 0.85;
        }

        .fc-daygrid-event {
          white-space: normal;
        }

        /* List view styling */
        .fc-list {
          border-color: hsl(var(--border));
        }

        .fc-list-day-cushion {
          background-color: hsl(var(--muted)) !important;
        }

        .fc-list-day-text,
        .fc-list-day-side-text {
          color: hsl(var(--foreground));
        }

        .fc-list-event:hover td {
          background-color: hsl(var(--muted));
        }

        .fc-list-event-title,
        .fc-list-event-time {
          color: hsl(var(--foreground));
        }

        /* More link */
        .fc-daygrid-more-link {
          color: hsl(var(--primary));
          font-weight: 500;
        }

        /* Popover styling */
        .fc-popover {
          background-color: hsl(var(--card));
          border-color: hsl(var(--border));
        }

        .fc-popover-header {
          background-color: hsl(var(--muted));
        }
      `}</style>
    </div>
  );
}
