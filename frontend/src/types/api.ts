/**
 * API-related TypeScript types
 */

export interface ApiError {
  detail: string;
  status?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name?: string | null;
    role: string;
    is_active: boolean;
  };
}

export interface Token {
  access_token: string;
  token_type: string;
}
