/**
 * Admin layout with authentication and role check
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Calendar, Tag, Users, FileText, Home, LogOut, Building2 } from 'lucide-react';
import { TenantProvider } from '@/lib/hooks/useTenant';
import { TenantSelector, TenantBadge } from '@/components/tenant/TenantSelector';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout, isAdmin, isAdminOrEditor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdminOrEditor)) {
      router.push('/login');
    }
  }, [user, loading, isAdminOrEditor, router]);

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

  if (!user || !isAdminOrEditor) {
    return null;
  }

  const navLinkClass = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Title + Desktop Nav */}
            <div className="flex items-center gap-6 lg:gap-8">
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">Admin-Panel</h1>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/admin" className={navLinkClass}>
                  Übersicht
                </Link>
                <Link href="/admin/events" className={navLinkClass}>
                  Events
                </Link>
                <Link href="/admin/categories" className={navLinkClass}>
                  Kategorien
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/admin/users" className={navLinkClass}>
                      Benutzer
                    </Link>
                    <Link href="/admin/tenants" className={navLinkClass}>
                      Verbände
                    </Link>
                  </>
                )}
                <Link href="/admin/audit" className={navLinkClass}>
                  Audit-Logs
                </Link>
              </nav>
            </div>

            {/* Desktop: Tenant Selector + User + Actions */}
            <div className="hidden md:flex items-center gap-4">
              <TenantSelector showAll={true} label="" className="text-sm" />
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                {user.full_name || user.username}
              </span>
              <button onClick={() => logout()} className={navLinkClass}>
                Abmelden
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
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
            <div className="px-4 py-4 space-y-1">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
                <span className="text-sm font-medium truncate">
                  {user.full_name || user.username}
                </span>
              </div>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <LayoutDashboard size={18} />
                <span>Übersicht</span>
              </Link>
              <Link
                href="/admin/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Calendar size={18} />
                <span>Events</span>
              </Link>
              <Link
                href="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Tag size={18} />
                <span>Kategorien</span>
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Users size={18} />
                    <span>Benutzer</span>
                  </Link>
                  <Link
                    href="/admin/tenants"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Building2 size={18} />
                    <span>Verbände</span>
                  </Link>
                </>
              )}
              <Link
                href="/admin/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <FileText size={18} />
                <span>Audit-Logs</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
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

// Wrap the layout with TenantProvider
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </TenantProvider>
  );
}
