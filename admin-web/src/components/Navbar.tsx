"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";

export function Navbar() {
  const { isLoggedIn, isAdmin } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    ...(isAdmin ? [{ label: "用户管理", href: "/users" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">Agentic Engineer</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden sm:flex items-center gap-6" data-testid="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-4">
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <Button size="sm" onClick={() => router.push("/login")}>
              Login
            </Button>
          )}
        </div>

        {/* Mobile hamburger button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border">
          <nav className="container flex flex-col gap-1 px-4 py-4" data-testid="mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              {isLoggedIn ? (
                <UserMenu />
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/login");
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}