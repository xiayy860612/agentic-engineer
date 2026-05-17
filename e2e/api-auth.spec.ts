import { test, expect, request as playwrightRequest } from "@playwright/test";

const E2E_ADMIN_USERNAME = "e2e_admin";
const E2E_ADMIN_PASSWORD = "E2E_Pass_123";
const E2E_USER_USERNAME = "e2e_user";
const E2E_USER_PASSWORD = "E2E_User_123";
const E2E_INACTIVE_USERNAME = "e2e_inactive";
const E2E_INACTIVE_PASSWORD = "E2E_Inactive_123";

const BASE = "http://127.0.0.1:8000";

async function loginAs(
  requestContext: any,
  username: string,
  password: string
): Promise<{ cookies: string[]; userCtx: any }> {
  const ctx = await requestContext.newContext();
  const res = await ctx.fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { username, password },
  });
  const cookies = ctx.cookies(BASE);
  await ctx.dispose();
  return { cookies, userCtx: res.ok() };
}

test.describe("API: auth endpoints", () => {
  test("SC5: GET /session returns 401 without cookie", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.fetch(`${BASE}/api/v1/auth/session`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test("SC1: GET /session returns 200 and roles for authenticated admin", async () => {
    const ctx = await playwrightRequest.newContext();
    // Log in first
    const loginRes = await ctx.fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBe(true);
    const sessionRes = await ctx.fetch(`${BASE}/api/v1/auth/session`);
    expect(sessionRes.status()).toBe(200);
    const body = await sessionRes.json() as { username?: string; roles?: string[] };
    expect(body.username).toBe(E2E_ADMIN_USERNAME);
    expect(body.roles).toContain("admin");
    await ctx.dispose();
  });

  test("SC2: GET /session returns 200 and user role for authenticated user", async () => {
    const ctx = await playwrightRequest.newContext();
    await ctx.fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { username: E2E_USER_USERNAME, password: E2E_USER_PASSWORD },
    });
    const sessionRes = await ctx.fetch(`${BASE}/api/v1/auth/session`);
    expect(sessionRes.status()).toBe(200);
    const body = await sessionRes.json() as { username?: string; roles?: string[] };
    expect(body.username).toBe(E2E_USER_USERNAME);
    expect(body.roles).toContain("user");
    await ctx.dispose();
  });

  test("SC3: inactive user login returns 403", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { username: E2E_INACTIVE_USERNAME, password: E2E_INACTIVE_PASSWORD },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });
});

test.describe("API: user CRUD auth guards", () => {
  test("GET /api/v1/users returns 200 for admin", async () => {
    const ctx = await playwrightRequest.newContext();
    // Log in as admin
    await ctx.fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD },
    });
    const res = await ctx.fetch(`${BASE}/api/v1/users`);
    expect(res.status()).toBe(200);
    const users = await res.json() as any[];
    expect(Array.isArray(users)).toBe(true);
    await ctx.dispose();
  });

  test("GET /api/v1/users returns 403 for user role", async () => {
    const ctx = await playwrightRequest.newContext();
    await ctx.fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { username: E2E_USER_USERNAME, password: E2E_USER_PASSWORD },
    });
    const res = await ctx.fetch(`${BASE}/api/v1/users`);
    expect(res.status()).toBe(403);
    const body = await res.json() as { detail?: string };
    expect(body.detail).toBe("无访问权限");
    await ctx.dispose();
  });

  test("GET /api/v1/users returns 401 when unauthenticated", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.fetch(`${BASE}/api/v1/users`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});