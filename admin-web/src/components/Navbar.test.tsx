import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";

const mockRouterPush = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("@/components/UserMenu", () => ({
  UserMenu: () => <span data-testid="usermenu">UserMenu</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: false });
  });

  it("renders brand name", () => {
    render(<Navbar />, { wrapper: TestWrapper });
    expect(screen.getByText("Agentic Engineer")).toBeInTheDocument();
  });

  it("renders home nav link", () => {
    render(<Navbar />, { wrapper: TestWrapper });
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("toggles mobile menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: TestWrapper });
    const hamburger = screen.getByRole("button", { name: "Toggle menu" });
    await user.click(hamburger);
  });
});