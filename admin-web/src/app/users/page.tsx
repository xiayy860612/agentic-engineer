"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authSessionUrl, usersListUrl, userUrl } from "@/lib/auth-api";
import { setAuthState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const sessionRes = await fetch(authSessionUrl(), { credentials: "include" });
      if (!sessionRes.ok) {
        router.replace("/login");
        return;
      }
      const sessionData = (await sessionRes.json()) as { username?: string; roles?: string[] };
      const username = sessionData.username ?? "";
      const roles = Array.isArray(sessionData.roles) ? sessionData.roles : [];
      setAuthState(username, roles);

      if (!roles.includes("admin")) {
        router.replace("/dashboard");
        return;
      }

      setCurrentUsername(username);

      const usersRes = await fetch(usersListUrl(), { credentials: "include" });
      if (!usersRes.ok) {
        if (usersRes.status === 401) {
          router.replace("/login");
          return;
        }
        setError("获取用户列表失败");
        setLoading(false);
        return;
      }
      const usersData = (await usersRes.json()) as User[];
      if (!cancelled) {
        setUsers(usersData);
        setLoading(false);
      }
    }

    void run();
    return () => { cancelled = true; };
  }, [router]);

  async function handleCreate(data: { username: string; password?: string; role: string }) {
    const res = await fetch(usersListUrl(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newUser = (await res.json()) as User;
      setUsers(prev => [newUser, ...prev]);
      setShowCreate(false);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`创建失败: ${(err as { detail?: string }).detail || res.status}`);
    }
  }

  async function handleEdit(userId: number, data: { role?: string; is_active?: boolean }) {
    const res = await fetch(userUrl(userId), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = (await res.json()) as User;
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      setShowEdit(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`更新失败: ${(err as { detail?: string }).detail || res.status}`);
    }
  }

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <Button onClick={() => setShowCreate(true)}>新建用户</Button>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">用户名</th>
              <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
              <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {user.role === "admin" ? "管理员" : "用户"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="text-green-600">启用</span>
                  ) : (
                    <span className="text-red-500">停用</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.username !== currentUsername ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEdit(user)}
                    >
                      编辑
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">当前用户</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <UserFormDialog
          title="新建用户"
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {showEdit && (
        <UserFormDialog
          title="编辑用户"
          initialValues={showEdit}
          onSubmit={(data) => handleEdit(showEdit.id, data)}
          onClose={() => setShowEdit(null)}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  title,
  initialValues,
  onSubmit,
  onClose,
}: {
  title: string;
  initialValues?: User;
  onSubmit: (data: { username: string; password?: string; role: string; is_active?: boolean }) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(initialValues?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialValues?.role ?? "user");
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: { username: string; password?: string; role: string; is_active?: boolean } = {
      username,
      role,
      is_active: isActive,
    };
    if (!initialValues || password) {
      data.password = password;
    }
    onSubmit(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={!!initialValues}
            />
          </div>
          {!initialValues && (
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required={!initialValues}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">角色</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="user">用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          {initialValues && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm">启用账户</label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">{initialValues ? "保存" : "创建"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}