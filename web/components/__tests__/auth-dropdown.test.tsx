import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// AuthDropdown 尚未实现 —— RED 状态
import { AuthDropdown } from "../auth-dropdown";

const mockPush = vi.fn();

describe("AuthDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders user email as dropdown trigger", () => {
    render(<AuthDropdown email="test@example.com" />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows Profile and Logout options when opened", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    // Radix DropdownMenu 默认不渲染 content
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("退出登录")).not.toBeInTheDocument();

    await user.click(screen.getByText("test@example.com"));

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("退出登录")).toBeInTheDocument();
  });

  it("renders Profile link with href=/profile", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    await user.click(screen.getByText("test@example.com"));

    const profileLink = screen.getByText("Profile").closest("a");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("calls signOut and navigates on logout click", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    await user.click(screen.getByText("test@example.com"));
    await user.click(screen.getByText("退出登录"));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});
