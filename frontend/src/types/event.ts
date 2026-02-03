/**
 * Event-related TypeScript types
 */

export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface Event {
  id: number;
  title: string;
  description?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  location?: string | null;
  location_url?: string | null;
  status: EventStatus;
  category_id?: number | null;
  category?: {
    id: number;
    name: string;
    color: string;
  } | null;
  submitter_id: number;
  submitter_name?: string | null;
  submitter_email?: string | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by?: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  location_url?: string;
  category_id?: number;
  submitter_name?: string;
  submitter_email?: string;
  is_public?: boolean;
}

export interface EventUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  location_url?: string;
  category_id?: number;
  is_public?: boolean;
}

export interface EventRejection {
  rejection_reason: string;
}
