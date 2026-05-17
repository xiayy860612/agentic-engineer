import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import DashboardPage from "./page";

const mockRouterReplace = vi.fn();
const mockFetch = vi.fn();
const mockLogout = vi.fn();

vi.stubGlobal("fetch", mockFetch);
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock AuthContext at module level
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when logged in", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { username: "testuser", roles: ["admin"] },
        isLoggedIn: true,
        logout: mockLogout,
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ username: "testuser", roles: ["admin"] }),
      });
    });

    it("renders dashboard page", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });
    });

    it("shows username", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-username")).toHaveTextContent("testuser");
      });
    });

    it("renders logout button", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-logout")).toBeInTheDocument();
      });
    });

    it("calls logout on button click", async () => {
      mockLogout.mockResolvedValue(undefined);
      render(<DashboardPage />);
      await waitFor(() => screen.getByTestId("dashboard-logout"));
      const logoutBtn = screen.getByTestId("dashboard-logout");
      await act(async () => {
        logoutBtn.click();
      });
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("when not logged in", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoggedIn: false,
        logout: mockLogout,
      });
      mockFetch.mockResolvedValue({
        ok: false,
      });
    });

    it("shows checking state initially", () => {
      render(<DashboardPage />);
      expect(screen.getByTestId("dashboard-checking")).toBeInTheDocument();
      expect(screen.getByText("正在验证会话…")).toBeInTheDocument();
    });
  });
});