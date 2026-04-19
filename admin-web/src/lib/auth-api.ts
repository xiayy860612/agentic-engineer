const ENV_KEY = "NEXT_PUBLIC_AUTH_API_BASE_URL";

/**
 * Auth HTTP API origin (scheme + host + port, no trailing slash).
 * Prefer setting {@link ENV_KEY}; local default matches auth-service/README dev port.
 */
export function getAuthApiBaseUrl(): string {
  const raw = process.env[ENV_KEY]?.trim();
  if (!raw) {
    return "http://127.0.0.1:8000";
  }
  return raw.replace(/\/$/, "");
}

export function authLoginUrl(): string {
  return `${getAuthApiBaseUrl()}/api/v1/auth/login`;
}

export function authSessionUrl(): string {
  return `${getAuthApiBaseUrl()}/api/v1/auth/session`;
}

export function authLogoutUrl(): string {
  return `${getAuthApiBaseUrl()}/api/v1/auth/logout`;
}
