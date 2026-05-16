// Module-level auth state shared across components
let _roles: string[] = [];
let _username: string | null = null;

export function setAuthState(username: string, roles: string[]) {
  _username = username;
  _roles = roles;
}

export function clearAuthState() {
  _username = null;
  _roles = [];
}

export function isAdmin(): boolean {
  return _roles.includes("admin");
}

export function getUsername(): string | null {
  return _username;
}