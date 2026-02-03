'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { API_ERROR_EVENT } from '@/lib/api/client';

/**
 * Listens for global API errors and shows a toast.
 * Must be rendered inside ToastProvider.
 */
export default function ApiErrorToaster() {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const message = (e as CustomEvent<string>).detail ?? 'Ein Fehler ist aufgetreten.';
      toast({
        title: 'Fehler',
        description: message,
        variant: 'error',
      });
    };

    window.addEventListener(API_ERROR_EVENT, handler);
    return () => window.removeEventListener(API_ERROR_EVENT, handler);
  }, [toast]);

  return null;
}
