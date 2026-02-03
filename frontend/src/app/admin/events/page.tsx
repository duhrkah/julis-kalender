/**
 * Admin event management page
 */
'use client';

import { useState, useEffect } from 'react';
import { Event, EventRejection } from '@/types/event';
import * as eventApi from '@/lib/api/events';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/components/ui/toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingEventId, setRejectingEventId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRejectIds, setBulkRejectIds] = useState<number[] | null>(null);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents(statusFilter || undefined);
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Laden der Events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    setSelectedIds(new Set());
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    if (!confirm('Event wirklich genehmigen?')) return;

    try {
      await eventApi.approveEvent(id);
      await loadEvents();
      toast({
        title: 'Erfolg',
        description: 'Event wurde erfolgreich genehmigt',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Genehmigen';
      setError(errorMessage);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectingEventId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingEventId) return;
    if (!rejectionReason.trim()) {
      toast({
        title: 'Warnung',
        description: 'Bitte geben Sie einen Ablehnungsgrund an',
        variant: 'warning',
      });
      return;
    }

    try {
      await eventApi.rejectEvent(rejectingEventId, { rejection_reason: rejectionReason });
      setRejectingEventId(null);
      setRejectionReason('');
      await loadEvents();
      toast({
        title: 'Erfolg',
        description: 'Event wurde erfolgreich abgelehnt',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Ablehnen';
      setError(errorMessage);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pending = events.filter((e) => e.status === 'pending');
    if (selectedIds.size === pending.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((e) => e.id)));
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !confirm(`${ids.length} Event(s) genehmigen?`)) return;
    try {
      const res = await eventApi.bulkApproveEvents(ids);
      setSelectedIds(new Set());
      await loadEvents();
      toast({
        title: 'Erfolg',
        description: `${res.approved} von ${res.total} Events genehmigt`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.response?.data?.detail || 'Fehler', variant: 'error' });
    }
  };

  const handleBulkRejectOpen = () => {
    setBulkRejectIds(Array.from(selectedIds));
    setBulkRejectReason('');
  };

  const handleBulkRejectSubmit = async () => {
    if (!bulkRejectIds?.length || !bulkRejectReason.trim()) {
      toast({ title: 'Warnung', description: 'Ablehnungsgrund angeben', variant: 'warning' });
      return;
    }
    try {
      const res = await eventApi.bulkRejectEvents(bulkRejectIds, bulkRejectReason);
      setBulkRejectIds(null);
      setSelectedIds(new Set());
      await loadEvents();
      toast({
        title: 'Erfolg',
        description: `${res.rejected} von ${res.total} Events abgelehnt`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.response?.data?.detail || 'Fehler', variant: 'error' });
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await eventApi.exportEventsCsv(statusFilter || undefined);
      toast({ title: 'Erfolg', description: 'CSV heruntergeladen', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.response?.data?.detail || 'Fehler', variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Event wirklich löschen?')) return;

    try {
      await eventApi.adminDeleteEvent(id);
      await loadEvents();
      toast({
        title: 'Erfolg',
        description: 'Event wurde erfolgreich gelöscht',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Löschen';
      setError(errorMessage);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const formatDate = (dateStr: string, timeStr?: string | null) => {
    try {
      const date = new Date(dateStr);
      let result = format(date, 'dd.MM.yyyy', { locale: de });
      if (timeStr) {
        result += ` ${timeStr.substring(0, 5)}`;
      }
      return result;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-julis-soft-yellow text-foreground',
      approved: 'bg-julis-soft-cyan text-foreground',
      rejected: 'bg-destructive/20 text-destructive',
    };
    const labels = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Event-Verwaltung</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verwalten Sie eingereichte Events und genehmigen Sie diese
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
          {error}
        </div>
      )}

      {/* Filter + Bulk + Export */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setStatusFilter('pending')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            statusFilter === 'pending'
              ? 'bg-primary text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Ausstehend ({events.filter(e => e.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            statusFilter === 'approved'
              ? 'bg-primary text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Genehmigt
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-primary text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Abgelehnt
        </button>
        <button
          onClick={() => setStatusFilter('')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            statusFilter === ''
              ? 'bg-primary text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Alle
        </button>
        <div className="flex-1" />
        {statusFilter === 'pending' && events.some((e) => e.status === 'pending') && (
          <>
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted text-sm"
            >
              {selectedIds.size === events.filter((e) => e.status === 'pending').length
                ? 'Keine auswählen'
                : 'Alle auswählen'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 text-sm"
                >
                  {selectedIds.size} genehmigen
                </button>
                <button
                  onClick={handleBulkRejectOpen}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm"
                >
                  {selectedIds.size} ablehnen
                </button>
              </>
            )}
          </>
        )}
        <button
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="px-4 py-2 border border-border rounded-md hover:bg-muted text-sm disabled:opacity-50"
        >
          {exporting ? '...' : 'CSV exportieren'}
        </button>
      </div>

      {/* Bulk Reject Modal */}
      {bulkRejectIds && bulkRejectIds.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-lg max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              {bulkRejectIds.length} Events ablehnen
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Ablehnungsgrund *</label>
              <textarea
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Geben Sie einen Grund für die Ablehnung an..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRejectSubmit}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Ablehnen
              </button>
              <button
                onClick={() => setBulkRejectIds(null)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-foreground"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingEventId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-6 rounded-lg max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Event ablehnen</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Ablehnungsgrund *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Geben Sie einen Grund für die Ablehnung an..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRejectSubmit}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Ablehnen
              </button>
              <button
                onClick={() => setRejectingEventId(null)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-foreground"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : events.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border text-center text-muted-foreground">
            Keine Events gefunden.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 flex gap-3">
                  {event.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(event.id)}
                      onChange={() => toggleSelect(event.id)}
                      className="mt-1 rounded border-border"
                    />
                  )}
                  <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    {getStatusBadge(event.status)}
                    {event.category && (
                      <span
                        className="px-2 py-1 text-xs rounded"
                        style={{
                          backgroundColor: event.category.color + '20',
                          color: event.category.color,
                        }}
                      >
                        {event.category.name}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                  )}
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Datum:</span>{' '}
                      {formatDate(event.start_date, event.start_time)}
                      {event.end_date && ` - ${formatDate(event.end_date, event.end_time)}`}
                    </div>
                    {event.location && (
                      <div>
                        <span className="font-medium">Ort:</span> {event.location}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Eingereicht von:</span>{' '}
                      {event.submitter_name || 'Unbekannt'}
                      {event.submitter_email && ` (${event.submitter_email})`}
                    </div>
                    {event.rejection_reason && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive">
                        <span className="font-medium">Ablehnungsgrund:</span> {event.rejection_reason}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                {event.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(event.id)}
                      className="px-4 py-2 bg-accent text-accent-foreground text-sm rounded-md hover:bg-accent/90 transition-colors"
                    >
                      Genehmigen
                    </button>
                    <button
                      onClick={() => handleRejectClick(event.id)}
                      className="px-4 py-2 bg-destructive text-destructive-foreground text-sm rounded-md hover:bg-destructive/90 transition-colors"
                    >
                      Ablehnen
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-4 py-2 border border-border text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
