/**
 * Event API calls
 */
import apiClient from './client';
import { Event, EventCreate, EventUpdate, EventRejection } from '@/types/event';

/**
 * Get current user's events
 */
export const getMyEvents = async (): Promise<Event[]> => {
  const { data } = await apiClient.get<Event[]>('/events');
  return data;
};

export interface UserEventStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Get current user's event counts by status (for dashboard).
 */
export const getMyEventStats = async (): Promise<UserEventStats> => {
  const { data } = await apiClient.get<UserEventStats>('/events/stats');
  return data;
};

/**
 * Get event by ID
 */
export const getEvent = async (id: number): Promise<Event> => {
  const { data } = await apiClient.get<Event>(`/events/${id}`);
  return data;
};

/**
 * Create new event
 */
export const createEvent = async (event: EventCreate): Promise<Event> => {
  const { data } = await apiClient.post<Event>('/events', event);
  return data;
};

/**
 * Update event
 */
export const updateEvent = async (id: number, event: EventUpdate): Promise<Event> => {
  const { data } = await apiClient.put<Event>(`/events/${id}`, event);
  return data;
};

/**
 * Delete event
 */
export const deleteEvent = async (id: number): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
};

// Admin endpoints

/**
 * Get all events (Admin)
 */
export const getAllEvents = async (
  statusFilter?: string,
  categoryId?: number
): Promise<Event[]> => {
  const { data } = await apiClient.get<Event[]>('/admin/events', {
    params: {
      status_filter: statusFilter,
      category_id: categoryId,
    },
  });
  return data;
};

/**
 * Approve event (Admin)
 */
export const approveEvent = async (id: number): Promise<Event> => {
  const { data } = await apiClient.put<Event>(`/admin/events/${id}/approve`);
  return data;
};

/**
 * Reject event (Admin)
 */
export const rejectEvent = async (
  id: number,
  rejection: EventRejection
): Promise<Event> => {
  const { data } = await apiClient.put<Event>(`/admin/events/${id}/reject`, rejection);
  return data;
};

/**
 * Delete event (Admin)
 */
export const adminDeleteEvent = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/events/${id}`);
};

/**
 * Bulk approve events (Admin)
 */
export const bulkApproveEvents = async (eventIds: number[]): Promise<{ approved: number; total: number }> => {
  const { data } = await apiClient.post<{ approved: number; total: number }>('/admin/events/bulk-approve', {
    event_ids: eventIds,
  });
  return data;
};

/**
 * Bulk reject events (Admin)
 */
export const bulkRejectEvents = async (
  eventIds: number[],
  rejectionReason: string
): Promise<{ rejected: number; total: number }> => {
  const { data } = await apiClient.post<{ rejected: number; total: number }>('/admin/events/bulk-reject', {
    event_ids: eventIds,
    rejection_reason: rejectionReason,
  });
  return data;
};

/**
 * Export events as CSV (Admin) - triggers download
 */
export const exportEventsCsv = async (
  statusFilter?: string,
  categoryId?: number
): Promise<void> => {
  const params: Record<string, string> = {};
  if (statusFilter) params.status_filter = statusFilter;
  if (categoryId) params.category_id = String(categoryId);
  const { data } = await apiClient.get<Blob>('/admin/events/export/csv', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Public endpoints

/**
 * Get single public event by ID (no auth required)
 */
export const getPublicEvent = async (id: number): Promise<Event> => {
  const { data } = await apiClient.get<Event>(`/public/events/${id}`);
  return data;
};

/**
 * Get public events (no auth required)
 * @param categoryId - Filter by category ID
 * @param categoryName - Filter by category name (alternative to categoryId)
 */
export const getPublicEvents = async (
  categoryId?: number,
  search?: string,
  categoryName?: string
): Promise<Event[]> => {
  const params: Record<string, string | number> = {};
  if (categoryId != null) params.category_id = categoryId;
  if (search) params.search = search;
  if (categoryName && categoryId == null) params.category = categoryName;
  const { data } = await apiClient.get<Event[]>('/public/events', { params });
  return data;
};
