import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import React from "react";

const mockFetch = vi.fn();
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal("fetch", mockFetch);
vi.stubGlobal("sessionStorage", mockSessionStorage);

function TestConsumer() {
  const { user, isLoggedIn, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : "null"}</span>
      <span data-testid="isLoggedIn">{String(isLoggedIn)}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <button data-testid="login" onClick={() => login("testuser", ["admin", "user"])}>
        Login
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockReturnValue(undefined);
    mockSessionStorage.removeItem.mockReturnValue(undefined);
  });

  it("provides initial state with no user", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(screen.getByTestId("isLoggedIn").textContent).toBe("false");
      expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    });
  });

  it("login updates user state", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("null"));
    const loginBtn = screen.getByTestId("login");
    await act(async () => {
      loginBtn.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("testuser");
      expect(screen.getByTestId("isLoggedIn").textContent).toBe("true");
      expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    });
  });

  it("logout clears user state", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("null"));
    const loginBtn = screen.getByTestId("login");
    await act(async () => {
      loginBtn.click();
    });
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("testuser"));
    mockFetch.mockResolvedValueOnce({ ok: true });
    const logoutBtn = screen.getByTestId("logout");
    await act(async () => {
      logoutBtn.click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(screen.getByTestId("isLoggedIn").textContent).toBe("false");
    });
  });

  it("fetches session on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ username: "sessionuser", roles: ["admin"] }),
    });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("sessionuser");
      expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/session", { credentials: "include" });
  });
});