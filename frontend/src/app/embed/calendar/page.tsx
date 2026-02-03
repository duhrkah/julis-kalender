/**
 * Embeddable calendar view (minimal UI for iframe)
 * Supports URL params: category_id, lang, height
 */
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Event } from '@/types/event';
import { Category } from '@/types/category';
import * as eventApi from '@/lib/api/events';
import * as categoryApi from '@/lib/api/categories';
import FullCalendarWrapper from '@/components/calendar/FullCalendarWrapper';
import EventModal from '@/components/calendar/EventModal';
import { useTranslation } from '@/lib/i18n';

function EmbedCalendarContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialCategoryId = useMemo(() => {
    const id = searchParams.get('category_id');
    return id ? parseInt(id, 10) : undefined;
  }, [searchParams]);
  const embedHeight = searchParams.get('height') || 'auto';

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(initialCategoryId);
  }, [initialCategoryId]);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        eventApi.getPublicEvents(selectedCategory),
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

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('embed.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-sm flex-shrink-0 ${
              selectedCategory === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            {t('home.allEvents')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-sm flex-shrink-0 ${
                selectedCategory === category.id
                  ? 'text-white'
                  : 'bg-card border hover:opacity-80'
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category.id ? category.color : undefined,
                borderColor: category.color,
                color: selectedCategory === category.id ? 'white' : category.color,
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

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
