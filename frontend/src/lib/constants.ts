/**
 * Application constants
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const EVENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const DATE_FORMAT = 'dd.MM.yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';
