import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockRouterReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { username: "testuser", roles: ["admin"] },
    logout: mockLogout,
  }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders username", () => {
    render(<UserMenu />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("opens menu on click", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: /testuser/i }));
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls logout on logout button click", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: /testuser/i }));
    await user.click(screen.getByText("Logout"));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith("/login");
  });
});