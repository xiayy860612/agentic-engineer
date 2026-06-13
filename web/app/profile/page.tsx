import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Mail, Shield, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function ProfileContent() {
  const supabase = await createClient();

  let claims;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      redirect("/auth/login");
    }
    claims = data.claims;
  } catch {
    // getClaims() 调用失败（网络或服务端错误），重定向至登录页
    redirect("/auth/login");
  }

  const email = claims.email ?? "未知";
  const role = claims.role ?? "未分配";
  const sub = claims.sub ?? "未知";

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 max-w-md w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{email}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium">{role}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="text-sm font-medium font-mono break-all">
              {sub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
