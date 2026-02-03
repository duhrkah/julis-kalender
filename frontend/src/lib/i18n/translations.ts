/**
 * i18n translations helper
 */
import de from '../../../messages/de.json';
import en from '../../../messages/en.json';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

const translations: Record<Locale, typeof de> = {
  de,
  en,
};

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale];
}

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof de>;

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

/**
 * Translate function with interpolation support
 */
export function t(
  translations: typeof de,
  key: string,
  params?: Record<string, string | number>
): string {
  let value = getNestedValue(translations, key);

  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }

  return value;
}
