/**
 * Login page
 */
'use client';

import LoginForm from '@/components/forms/LoginForm';
import JuLisLogo from '@/components/ui/JuLisLogo';
import { useTranslation } from '@/lib/i18n';
import { APP_VERSION, APP_ENV } from '@/lib/constants';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <JuLisLogo size={64} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('auth.loginTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
          <LoginForm />
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} <a href="https://www.lucakohls.de" target="_blank" rel="noopener noreferrer">Luca Stephan Kohls</a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-1">
          v{APP_VERSION} · {APP_ENV === 'production' ? 'Prod' : APP_ENV === 'test' ? 'Test' : APP_ENV === 'development' ? 'Dev' : APP_ENV}
        </p>
      </div>
    </main>
  );
}
