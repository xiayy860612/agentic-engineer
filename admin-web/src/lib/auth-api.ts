const BASE = "/api/v1/auth";

export function authLoginUrl(): string {
  return `${BASE}/login`;
}

export function authSessionUrl(): string {
  return `${BASE}/session`;
}

export function authLogoutUrl(): string {
  return `${BASE}/logout`;
}

// User management API (admin-only)
const USERS_BASE = "/api/v1/users";

export function usersListUrl(): string {
  return USERS_BASE;
}

export function userUrl(id: number): string {
  return `${USERS_BASE}/${id}`;
}
