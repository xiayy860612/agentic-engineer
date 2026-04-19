"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authLogoutUrl, authSessionUrl } from "@/lib/auth-api";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const res = await fetch(authSessionUrl(), { credentials: "include" });
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as { username?: string };
      setUsername(typeof data.username === "string" ? data.username : null);
      setChecking(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    await fetch(authLogoutUrl(), { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  if (checking) {
    return (
      <div
        className="flex flex-1 items-center justify-center px-4 py-24 text-muted-foreground"
        data-testid="dashboard-checking"
      >
        正在验证会话…
      </div>
    );
  }

  return (
    <div
      className="container flex flex-1 flex-col gap-6 px-4 py-12 md:px-6"
      data-testid="dashboard-page"
    >
      <div className="rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="dashboard-title">
          控制台
        </h1>
        <p className="mt-2 text-muted-foreground">
          已登录占位页（阶段 0）。当前用户：
          <span className="font-medium text-foreground" data-testid="dashboard-username">
            {" "}
            {username ?? "—"}
          </span>
        </p>
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onLogout()}
            data-testid="dashboard-logout"
          >
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
}
