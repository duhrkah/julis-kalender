/**
 * Admin API (stats, audit logs, etc.)
 */
import apiClient from './client';

export interface AdminStats {
  pending_events: number;
  approved_events: number;
  rejected_events: number;
  categories_count: number;
  users_count: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  username: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}

/**
 * Get admin dashboard statistics (Admin only).
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return data;
};

export interface GetAuditLogsParams {
  skip?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  entity_type?: string;
}

/**
 * Get audit logs (Admin only).
 */
export const getAuditLogs = async (
  params?: GetAuditLogsParams
): Promise<AuditLogEntry[]> => {
  const { data } = await apiClient.get<AuditLogEntry[]>('/admin/audit-logs', {
    params: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 100,
      user_id: params?.user_id,
      action: params?.action,
      entity_type: params?.entity_type,
    },
  });
  return data;
};
