'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  Locale,
  locales,
  defaultLocale,
  getTranslations,
  t as translate,
} from './translations';
import de from '../../../messages/de.json';

type Translations = typeof de;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'julis-kalender-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>(
    getTranslations(defaultLocale)
  );

  useEffect(() => {
    // Get locale from localStorage or browser preference
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;

    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
      setTranslations(getTranslations(savedLocale));
    } else {
      // Check browser preference
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (locales.includes(browserLang)) {
        setLocaleState(browserLang);
        setTranslations(getTranslations(browserLang));
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale);
      setTranslations(getTranslations(newLocale));
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      // Update html lang attribute
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(translations, key, params);
    },
    [translations]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
