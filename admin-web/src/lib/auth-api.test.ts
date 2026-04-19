import { describe, it, expect, afterEach } from "vitest";
import { getAuthApiBaseUrl } from "./auth-api";

const KEY = "NEXT_PUBLIC_AUTH_API_BASE_URL";

describe("getAuthApiBaseUrl", () => {
  const previous = process.env[KEY];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[KEY];
    } else {
      process.env[KEY] = previous;
    }
  });

  it("strips trailing slash", () => {
    process.env[KEY] = "http://example.com:8000/";
    expect(getAuthApiBaseUrl()).toBe("http://example.com:8000");
  });

  it("uses default when unset", () => {
    delete process.env[KEY];
    expect(getAuthApiBaseUrl()).toBe("http://127.0.0.1:8000");
  });
});
