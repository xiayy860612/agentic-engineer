import { describe, it, expect } from "vitest";
import {
  authLoginUrl,
  authSessionUrl,
  authLogoutUrl,
  usersListUrl,
  userUrl,
} from "./auth-api";

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

describe("users API URL helpers", () => {
  it("usersListUrl returns users base path", () => {
    expect(usersListUrl()).toBe("/api/v1/users");
  });

  it("userUrl returns specific user path", () => {
    expect(userUrl(42)).toBe("/api/v1/users/42");
  });

  it("userUrl handles different ids", () => {
    expect(userUrl(1)).toBe("/api/v1/users/1");
    expect(userUrl(999)).toBe("/api/v1/users/999");
  });
});
