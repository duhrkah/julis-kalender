/**
 * Admin layout with authentication and role check
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">Admin-Panel</h1>
              <nav className="flex gap-4">
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Übersicht
                </Link>
                <Link
                  href="/admin/events"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Events
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Kategorien
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Benutzer
                </Link>
                <Link
                  href="/admin/audit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Audit-Logs
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-sm text-muted-foreground">
                {user.full_name || user.username}
              </span>
              <button
                onClick={() => logout()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
