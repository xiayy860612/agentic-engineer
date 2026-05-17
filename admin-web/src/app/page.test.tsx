import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe("HomePage", () => {
  it("renders hero section", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Agentic Engineer" })).toBeInTheDocument();
  });

  it("renders features grid", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Built for production" })).toBeInTheDocument();
  });

  it("renders get started button", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
  });

  it("renders all 6 features", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Agentic AI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tool Integration" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Observability" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scalable Architecture" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Security First" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Developer Experience" })).toBeInTheDocument();
  });
});