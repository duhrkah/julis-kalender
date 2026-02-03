'use client';

import { useI18n, locales, type Locale } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
};

const localeFlags: Record<Locale, string> = {
  de: 'DE',
  en: 'EN',
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-sm"
          aria-label="Change language"
        >
          <Globe size={18} />
          <span className="hidden sm:inline">{localeFlags[locale]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-popover border border-border rounded-md shadow-lg p-1 min-w-[120px] z-50"
      >
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
              locale === loc
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted'
            }`}
          >
            <span className="font-medium">{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
