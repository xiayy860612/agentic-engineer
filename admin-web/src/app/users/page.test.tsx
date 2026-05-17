import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "./page";
import { AuthProvider } from "@/contexts/AuthContext";

const mockRouterReplace = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

vi.mock("@/contexts/AuthContext", async () => {
  const actual = await import("@/contexts/AuthContext");
  return {
    ...actual,
    useAuth: () => ({
      isAdmin: true,
      user: { username: "admin", roles: ["admin"] },
    }),
  };
});

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const mockUsers = [
  { id: 1, username: "alice", role: "admin", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: 2, username: "bob", role: "user", is_active: false, created_at: "2024-01-02T00:00:00Z" },
];

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });
  });

  it("renders users table when loaded", async () => {
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText("用户管理")).toBeInTheDocument();
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("shows admin badge for admin users", async () => {
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText("管理员")).toBeInTheDocument();
    });
  });

  it("shows user badge for regular users", async () => {
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText("用户")).toBeInTheDocument();
    });
  });

  it("opens create dialog on new user button click", async () => {
    const user = userEvent.setup();
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => screen.getByText("alice"));
    await user.click(screen.getByRole("button", { name: "新建用户" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "新建用户" })).toBeInTheDocument();
    });
  });

  it("shows active/inactive status", async () => {
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText("启用")).toBeInTheDocument();
      expect(screen.getByText("停用")).toBeInTheDocument();
    });
  });

  it("shows edit dialog when edit button clicked", async () => {
    const user = userEvent.setup();
    render(<UsersPage />, { wrapper: TestWrapper });
    await waitFor(() => screen.getByText("alice"));
    // Click the first edit button (for bob)
    await user.click(screen.getAllByRole("button", { name: "编辑" })[0]);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "编辑用户" })).toBeInTheDocument();
    });
  });
});