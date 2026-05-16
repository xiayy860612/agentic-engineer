// Module-level auth state shared across components
let _roles: string[] = [];
let _username: string | null = null;

export function setAuthState(username: string, roles: string[]) {
  _username = username;
  _roles = roles;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("auth_username", username);
      sessionStorage.setItem("auth_roles", JSON.stringify(roles));
    } catch {
      // sessionStorage not available (e.g., test environment)
    }
  }
}

export function clearAuthState() {
  _username = null;
  _roles = [];
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("auth_username");
      sessionStorage.removeItem("auth_roles");
    } catch {
      // sessionStorage not available
    }
  }
}

export function isAdmin(): boolean {
  // On client, try to restore from sessionStorage if module state is empty
  if (typeof window !== "undefined" && _roles.length === 0) {
    try {
      const stored = sessionStorage.getItem("auth_roles");
      if (stored) {
        _roles = JSON.parse(stored) as string[];
      }
      const storedUser = sessionStorage.getItem("auth_username");
      if (storedUser !== null) {
        _username = storedUser;
      }
    } catch {
      // ignore parse errors
    }
  }
  return _roles.includes("admin");
}

export function getUsername(): string | null {
  return _username;
}