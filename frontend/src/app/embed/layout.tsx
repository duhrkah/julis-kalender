/**
 * Embed layout: minimal chrome, optimiert für iframe-Einbettung
 * - Theme aus URL (?theme=light|dark)
 * - postMessage für dynamische Höhe (Host sendet { type: 'embed-resize', height: 600 })
 */
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/ui/ThemeProvider';

function EmbedLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme from URL (?theme=light|dark)
  useEffect(() => {
    const theme = searchParams.get('theme');
    if (theme === 'light' || theme === 'dark') {
      setTheme(theme);
    }
  }, [searchParams, setTheme]);

  // postMessage: Host kann { type: 'embed-resize', height: number } senden
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'embed-resize' && typeof e.data.height === 'number' && containerRef.current) {
        containerRef.current.style.minHeight = `${e.data.height}px`;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div ref={containerRef} className="min-h-0 bg-background">
      {children}
    </div>
  );
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-0 bg-background">{children}</div>}>
      <EmbedLayoutInner>{children}</EmbedLayoutInner>
    </Suspense>
  );
}
