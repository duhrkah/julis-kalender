/**
 * Embeddable list view (optimiert für iframe)
 *
 * URL-Parameter:
 * - category_id: Kategorie filtern
 * - category: Kategorie nach Name (z.B. ?category=Landesverband)
 * - search: Suchbegriff
 * - compact: Kompakte Darstellung (?compact=1)
 * - theme: "light" oder "dark"
 * - event: Event-ID für Deep-Link (öffnet Modal beim Laden)
 */
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Event } from '@/types/event';
import { Category } from '@/types/category';
import * as eventApi from '@/lib/api/events';
import * as categoryApi from '@/lib/api/categories';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import EventModal from '@/components/calendar/EventModal';
import { useTranslation } from '@/lib/i18n';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Search } from 'lucide-react';

function EmbedListContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const initialCategoryId = useMemo(() => {
    const id = searchParams.get('category_id');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);
  const initialCategoryName = useMemo(() => searchParams.get('category') || undefined, [searchParams]);
  const initialSearch = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const compact = searchParams.get('compact') === '1' || searchParams.get('compact') === 'true';
  const eventIdParam = useMemo(() => {
    const id = searchParams.get('event');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(initialCategoryName);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSelectedCategory(initialCategoryId);
    setSelectedCategoryName(initialCategoryName);
    setSearchQuery(initialSearch);
  }, [initialCategoryId, initialCategoryName, initialSearch]);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedCategoryName, debouncedSearch]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        eventApi.getPublicEvents(
          selectedCategory,
          debouncedSearch || undefined,
          selectedCategoryName && !selectedCategory ? selectedCategoryName : undefined
        ),
        categoryApi.getPublicCategories(),
      ]);
      const sorted = eventsData.sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      setEvents(sorted);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync selectedCategory from category name when categories loaded
  useEffect(() => {
    if (selectedCategoryName && categories.length > 0 && selectedCategory === undefined) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === selectedCategoryName.toLowerCase()
      );
      if (match) setSelectedCategory(match.id);
    }
  }, [categories, selectedCategoryName, selectedCategory]);

  // Deep-Link: ?event=123 öffnet Event-Modal beim Laden
  useEffect(() => {
    if (!eventIdParam || events.length === 0) return;
    const event = events.find((e) => e.id === eventIdParam);
    if (event) {
      setSelectedEvent(event);
    } else {
      eventApi.getPublicEvent(eventIdParam).then(setSelectedEvent).catch(() => {});
    }
  }, [eventIdParam, events]);

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

  const padding = compact ? 'p-2' : 'p-4';

  if (loading && events.length === 0) {
    return (
      <div className={`${padding} min-h-[200px] flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={`${padding} space-y-3`}>
      {/* Suche + Kategorien */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-2.5 py-1.5 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${compact ? 'py-1 text-xs' : ''}`}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedCategory === undefined ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'
            } ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
          >
            {t('home.allEvents')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat.id ? 'text-white' : 'bg-card border hover:opacity-80'
              } ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
              style={{
                backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                borderColor: cat.color,
                color: selectedCategory === cat.id ? 'white' : cat.color,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t('events.emptySearch')}
        </div>
      ) : (
        events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => setSelectedEvent(event)}
            className="w-full text-left bg-card p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white font-bold"
                  style={{ backgroundColor: event.category?.color || '#E6007E' }}
                >
                  <div className="text-xs uppercase">
                    {format(new Date(event.start_date), 'MMM', { locale: de })}
                  </div>
                  <div className="text-xl">{format(new Date(event.start_date), 'dd')}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate">{event.title}</h3>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {event.organizer && <div className="font-medium">{event.organizer}</div>}
                  <div>{formatDate(event.start_date, event.start_time)}</div>
                  {event.location && (
                    <div className="flex items-center gap-1 truncate">
                      {event.location_url ? (
                        <a
                          href={event.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline truncate"
                        >
                          {event.location}
                        </a>
                      ) : (
                        event.location
                      )}
                    </div>
                  )}
                  {event.category && (
                    <span
                      className="inline-flex px-2 py-0.5 text-xs rounded"
                      style={{
                        backgroundColor: event.category.color + '20',
                        color: event.category.color,
                      }}
                    >
                      {event.category.name}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))
      )}

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} compact={compact} />
    </div>
  );
}

export default function EmbedListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <EmbedListContent />
    </Suspense>
  );
}
