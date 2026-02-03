/**
 * Public calendar page
 */
'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import { Category } from '@/types/category';
import * as eventApi from '@/lib/api/events';
import * as categoryApi from '@/lib/api/categories';
import FullCalendarWrapper from '@/components/calendar/FullCalendarWrapper';
import EventModal from '@/components/calendar/EventModal';
import Link from 'next/link';
import { API_URL } from '@/lib/constants';
import JuLisLogo from '@/components/ui/JuLisLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/lib/i18n';

export default function Home() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const getIcalUrl = (subscribe = false) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category_id', String(selectedCategory));
    const base = `${API_URL}/public/ical`;
    const qs = params.toString();
    const url = qs ? `${base}?${qs}` : base;
    return subscribe ? url.replace(/^https?:/, 'webcal:') : url;
  };

  const handleDownloadICal = () => {
    window.open(getIcalUrl(false), '_blank');
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        eventApi.getPublicEvents(selectedCategory, searchQuery || undefined),
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

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <JuLisLogo size={36} />
              <h1 className="text-xl sm:text-2xl font-bold">{t('home.title')}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('common.login')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                selectedCategory === undefined
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              {t('home.allEvents')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
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

        {/* Calendar */}
        {loading ? (
          <CalendarSkeleton />
        ) : events.length === 0 ? (
          <div className="bg-card p-12 rounded-lg border border-border text-center">
            <p className="text-lg font-medium mb-2">{t('events.emptySearch')}</p>
            <p className="text-muted-foreground">{t('events.emptySearchDescription')}</p>
          </div>
        ) : (
          <FullCalendarWrapper
            events={events}
            onEventClick={setSelectedEvent}
            height={700}
          />
        )}

        {/* Actions Section */}
        <div className="mt-6 sm:mt-8 grid md:grid-cols-2 gap-4">
          {/* Info Section */}
          <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
            <h2 className="text-base sm:text-lg font-semibold mb-2">{t('home.aboutTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('home.aboutDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
              <Link href="/login" className="text-primary hover:underline">
                {t('home.submitEvent')} →
              </Link>
              <a
                href="/embed/calendar"
                target="_blank"
                className="text-primary hover:underline"
              >
                {t('home.embedCalendar')} →
              </a>
            </div>
          </div>

          {/* iCal Export Section */}
          <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
            <h2 className="text-base sm:text-lg font-semibold mb-2">{t('home.subscribeTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('home.subscribeDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleDownloadICal}
                className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('home.downloadICal')}
              </button>
              <a
                href={getIcalUrl(true)}
                className="px-4 py-2 border border-primary text-primary text-sm rounded-md hover:bg-primary/10 transition-colors text-center"
              >
                {t('home.subscribeWebcal')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </main>
  );
}
