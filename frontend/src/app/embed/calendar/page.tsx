/**
 * Embeddable calendar view (optimiert für iframe, z.B. julis-sh.de)
 *
 * URL-Parameter:
 * - category_id: Kategorie filtern (z.B. ?category_id=3)
 * - category: Kategorie nach Name (z.B. ?category=Landesverband)
 * - search: Suchbegriff (z.B. ?search=Seminar)
 * - height: Höhe in px (z.B. ?height=600), "auto" für automatisch
 * - compact: Kompakte Darstellung (z.B. ?compact=1)
 * - view: "month" oder "list" (Standard: month)
 * - theme: "light" oder "dark"
 * - toolbar: "0" um Kalender-Navigation zu verbergen
 * - event: Event-ID für Deep-Link (öffnet Modal beim Laden)
 * - tenant: Verband-Slug für Mandantenfähigkeit (z.B. ?tenant=bayern)
 * - tenant_id: Verband-ID für Mandantenfähigkeit (z.B. ?tenant_id=2)
 */
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Event } from '@/types/event';
import { Category } from '@/types/category';
import * as eventApi from '@/lib/api/events';
import * as categoryApi from '@/lib/api/categories';
import { setTenantContext, clearTenantContext } from '@/lib/api/tenants';
import FullCalendarWrapper from '@/components/calendar/FullCalendarWrapper';
import EventModal from '@/components/calendar/EventModal';
import { useTranslation } from '@/lib/i18n';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Search } from 'lucide-react';
import { CalendarSkeleton } from '@/components/ui/Skeleton';

function EmbedCalendarContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const initialCategoryId = useMemo(() => {
    const id = searchParams.get('category_id');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);

  const initialCategoryName = useMemo(() => searchParams.get('category') || undefined, [searchParams]);
  const initialSearch = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const embedHeight = searchParams.get('height') || '600';
  const compact = searchParams.get('compact') === '1' || searchParams.get('compact') === 'true';
  const hideToolbar = searchParams.get('toolbar') === '0';
  const initialView = (searchParams.get('view') === 'list' ? 'listMonth' : 'dayGridMonth') as 'dayGridMonth' | 'listMonth';
  const eventIdParam = useMemo(() => {
    const id = searchParams.get('event');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);

  // Tenant (Verband) filter for multi-tenancy
  const tenantSlug = useMemo(() => searchParams.get('tenant') || undefined, [searchParams]);
  const tenantId = useMemo(() => {
    const id = searchParams.get('tenant_id');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);

  // Set tenant context for API calls
  useEffect(() => {
    if (tenantSlug) {
      setTenantContext(tenantSlug);
    } else {
      clearTenantContext();
    }
    return () => clearTenantContext();
  }, [tenantSlug]);

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
    loadData();
  }, [selectedCategory, selectedCategoryName, debouncedSearch]);

  const loadData = async () => {
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
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const heightNum = embedHeight === 'auto' ? 'auto' : parseInt(embedHeight, 10) || 600;
  const padding = compact ? 'p-2' : 'p-4';

  if (loading && events.length === 0) {
    return (
      <div className={`${padding} min-h-[300px]`}>
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className={padding}>
      {/* Filter-Leiste: Suche + Kategorien */}
      <div className={`flex flex-col gap-2 mb-3 ${compact ? 'mb-2' : ''}`}>
        {/* Suche */}
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-2.5 py-1.5 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${compact ? 'py-1 text-xs' : ''}`}
            aria-label={t('home.searchPlaceholder')}
          />
        </div>

        {/* Kategorie-Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedCategory === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            } ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
          >
            {t('home.allEvents')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category.id ? 'text-white' : 'bg-card border hover:opacity-80'
              } ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : undefined,
                borderColor: category.color,
                color: selectedCategory === category.id ? 'white' : category.color,
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kalender */}
      {events.length === 0 ? (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <p className="text-sm font-medium text-muted-foreground">{t('events.emptySearch')}</p>
        </div>
      ) : (
        <FullCalendarWrapper
          events={events}
          onEventClick={setSelectedEvent}
          height={heightNum}
          initialView={initialView}
          hideToolbar={hideToolbar}
        />
      )}

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} compact={compact} />
    </div>
  );
}

export default function EmbedCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <CalendarSkeleton />
        </div>
      }
    >
      <EmbedCalendarContent />
    </Suspense>
  );
}
