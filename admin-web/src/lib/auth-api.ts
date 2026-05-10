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
