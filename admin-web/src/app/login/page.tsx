"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authLoginUrl, authSessionUrl } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(authLoginUrl(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        success?: boolean;
      };
      if (!res.ok) {
        if (res.status === 401 && typeof data.message === "string") {
          setError(data.message);
        } else {
          setError("登录失败，请稍后重试。");
        }
        return;
      }
      if (res.ok && data.success === true) {
        // After login success, fetch session to get roles
        const sessionRes = await fetch(authSessionUrl(), { credentials: "include" });
        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as { username?: string; roles?: string[] };
          const sessionUsername = sessionData.username ?? username;
          const roles = Array.isArray(sessionData.roles) ? sessionData.roles : [];
          login(sessionUsername, roles);
        }
        router.replace("/dashboard");
        return;
      }
      setError("登录失败，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-16"
      data-testid="login-page"
    >
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
          <p className="text-sm text-muted-foreground">使用用户名与密码进入管理端</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit} data-testid="login-form">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              data-testid="login-username"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert" data-testid="login-error">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending} data-testid="login-submit">
            {pending ? "登录中…" : "登录"}
          </Button>
        </form>
      </div>
    </div>
  );
}
