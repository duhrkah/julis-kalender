/**
 * Audit logs page (Admin only)
 */
'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, type AuditLogEntry } from '@/lib/api/admin';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  approve: 'Genehmigt',
  reject: 'Abgelehnt',
  create: 'Erstellt',
  update: 'Aktualisiert',
  delete: 'Gelöscht',
};

const ENTITY_LABELS: Record<string, string> = {
  event: 'Event',
  user: 'Benutzer',
  category: 'Kategorie',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs({
        limit: 200,
        action: filterAction || undefined,
        entity_type: filterEntityType || undefined,
      });
      setLogs(data);
      setError(null);
    } catch {
      setError('Audit-Logs konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntityType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit-Logs</h1>
        <p className="text-muted-foreground mt-1">
          Alle Admin-Aktionen nachverfolgen
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Aktion:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Alle</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Entität:</span>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Alle</option>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Laden...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Keine Einträge gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Zeit</th>
                  <th className="text-left p-3 font-medium">Benutzer</th>
                  <th className="text-left p-3 font-medium">Aktion</th>
                  <th className="text-left p-3 font-medium">Entität</th>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border">
                    <td className="p-3 whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </td>
                    <td className="p-3">{log.username ?? '-'}</td>
                    <td className="p-3">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="p-3">
                      {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                    </td>
                    <td className="p-3">{log.entity_id ?? '-'}</td>
                    <td className="p-3 max-w-xs truncate" title={log.details ?? undefined}>
                      {log.details ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
