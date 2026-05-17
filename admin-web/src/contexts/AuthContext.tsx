"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authLogoutUrl, authSessionUrl } from "@/lib/auth-api";

interface AuthUser {
  username: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (username: string, roles: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Client-side hydration: fetch session from API to validate stored credentials
  useEffect(() => {
    async function fetchSession() {
      const res = await fetch(authSessionUrl(), { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { username?: string; roles?: string[] };
        const username = data.username ?? "";
        const roles = Array.isArray(data.roles) ? data.roles : [];
        setUser({ username, roles });
        try {
          sessionStorage.setItem("auth_username", username);
          sessionStorage.setItem("auth_roles", JSON.stringify(roles));
        } catch {
          // ignore storage errors
        }
      }
    }

    void fetchSession();
  }, []);

  const login = useCallback((username: string, roles: string[]) => {
    setUser({ username, roles });
    try {
      sessionStorage.setItem("auth_username", username);
      sessionStorage.setItem("auth_roles", JSON.stringify(roles));
    } catch {
      // ignore storage errors
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      sessionStorage.removeItem("auth_username");
      sessionStorage.removeItem("auth_roles");
    } catch {
      // ignore storage errors
    }
    await fetch(authLogoutUrl(), { method: "POST", credentials: "include" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isAdmin: user !== null && user.roles.includes("admin"),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}