"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authSessionUrl } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    async function checkSession() {
      const res = await fetch(authSessionUrl(), { credentials: "include" });
      if (!res.ok) {
        router.replace("/login");
      }
    }

    if (!isLoggedIn) {
      void checkSession();
    }
  }, [isLoggedIn, router]);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!isLoggedIn) {
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
            {user?.username ?? "—"}
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