import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const mockRouterReplace = vi.fn();
const mockLogin = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockImplementation((username, roles) => {});
    mockRouterReplace.mockImplementation(() => {});
  });

  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByTestId("login-username")).toBeInTheDocument();
    expect(screen.getByTestId("login-password")).toBeInTheDocument();
  });

  it("allows typing username and password", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByTestId("login-username"), "testuser");
    await user.type(screen.getByTestId("login-password"), "password123");
    expect(screen.getByTestId("login-username")).toHaveValue("testuser");
    expect(screen.getByTestId("login-password")).toHaveValue("password123");
  });

  it("shows error on failed login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    });
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByTestId("login-username"), "baduser");
    await user.type(screen.getByTestId("login-password"), "badpass");
    await user.click(screen.getByTestId("login-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toHaveTextContent("Invalid credentials");
    });
  });

  it("calls login and router.replace on success", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ username: "testuser", roles: ["admin"] }),
      });
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByTestId("login-username"), "admin");
    await user.type(screen.getByTestId("login-password"), "admin123");
    await user.click(screen.getByTestId("login-submit"));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", ["admin"]);
      expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard");
    }, { timeout: 3000 });
  });
});