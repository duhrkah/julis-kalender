/**
 * Application constants
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** Build-Version (aus package.json) */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
/** Umgebung: dev | test | production */
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'dev';

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
