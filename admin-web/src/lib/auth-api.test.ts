import { describe, it, expect } from "vitest";
import { authLoginUrl, authSessionUrl, authLogoutUrl } from "./auth-api";

describe("auth URL helpers", () => {
  it("authLoginUrl returns relative path", () => {
    expect(authLoginUrl()).toBe("/api/v1/auth/login");
  });

  it("authSessionUrl returns relative path", () => {
    expect(authSessionUrl()).toBe("/api/v1/auth/session");
  });

  it("authLogoutUrl returns relative path", () => {
    expect(authLogoutUrl()).toBe("/api/v1/auth/logout");
  });
});
