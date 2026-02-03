/**
 * Dashboard layout with authentication check
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Menu, X, Home, Calendar, Settings, LogOut } from 'lucide-react';
import JuLisLogo from '@/components/ui/JuLisLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <JuLisLogo size={32} />
              <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Dashboard</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Kalender
              </Link>
              <span className="text-sm text-muted-foreground">
                {user.full_name || user.username}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {user.role === 'admin' ? 'Admin' : 'Benutzer'}
              </span>
              <ThemeToggle />
              <button
                onClick={() => logout()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Abmelden
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-4 py-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <span className="text-sm font-medium">
                  {user.full_name || user.username}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {user.role === 'admin' ? 'Admin' : 'Benutzer'}
                </span>
              </div>

              {/* Navigation Links */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/events/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Calendar size={18} />
                <span>Neues Event</span>
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Calendar size={18} />
                <span>Kalender ansehen</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Settings size={18} />
                  <span>Admin-Panel</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-muted transition-colors text-red-500"
              >
                <LogOut size={18} />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
