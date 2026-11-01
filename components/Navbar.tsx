"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export interface NavbarUser {
  id: string;
  name: string;
  email: string;
  role: string;
  city?: string | null;
}

function getInitials(name?: string, email?: string): string {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function Navbar({
  initialUser,
}: {
  initialUser: NavbarUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | null>(initialUser);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = (await csrfRes.json()) as { csrfToken?: string };
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken: csrfData.csrfToken || "",
          callbackUrl: "/",
          json: "true",
        }),
      });
    } catch {}
    setUser(null);
    setSigningOut(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const isRadar = pathname === "/" || pathname.startsWith("/events");
  const isCities = pathname.startsWith("/cities");
  const isPassport = pathname.startsWith("/passport");
  const isScan = pathname.startsWith("/organizer/scan");
  const now = new Date();
  const issueLabel = `Issue ${String(now.getMonth() + 1).padStart(2, "0")}.${String(
    now.getFullYear()
  ).slice(-2)} / Live edition`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-foreground/30 bg-background/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto grid h-[4.5rem] max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        {/* Wordmark */}
        <Link
          className="group flex min-w-0 min-h-11 items-center gap-2 border-r border-foreground/30 pr-3 sm:gap-3 sm:pr-4 lg:border-r-0"
          href="/"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="grid size-8 shrink-0 place-items-center border border-foreground bg-primary font-mono text-[10px] font-bold text-white transition-transform group-hover:-rotate-3 shadow-[2px_2px_0px_0px_currentColor]">
            EV
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-2xl font-bold leading-none tracking-[-0.03em] text-foreground group-hover:text-primary transition-colors">
              Eventr
            </span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground md:block">
              Pakistan event intelligence
            </span>
          </span>
        </Link>

        {/* Central Dispatch Marker */}
        <div className="hidden items-center border-x border-foreground/30 px-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex">
          {issueLabel}
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 pl-3 lg:pl-6">
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
            <Link
              href="/"
              className={`hidden md:flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isRadar
                  ? "text-primary font-bold underline decoration-2 underline-offset-4"
                  : "text-foreground hover:text-primary"
              }`}
            >
              Radar
            </Link>
            <Link
              href="/cities"
              className={`hidden md:flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isCities
                  ? "text-primary font-bold underline decoration-2 underline-offset-4"
                  : "text-foreground hover:text-primary"
              }`}
            >
              Cities
            </Link>
            <Link
              href="/passport"
              className={`hidden md:flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isPassport
                  ? "text-primary font-bold underline decoration-2 underline-offset-4"
                  : "text-foreground hover:text-primary"
              }`}
            >
              Passport
            </Link>
            {(user?.role === "ORGANIZER" || user?.role === "ADMIN") && (
              <Link
                href="/organizer/scan"
                className={`hidden xl:flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  isScan
                    ? "text-primary font-bold underline decoration-2 underline-offset-4"
                    : "text-foreground hover:text-primary"
                }`}
              >
                Scanner
              </Link>
            )}

            <ThemeToggle />

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/account"
                  title={`Signed in as ${user.name || user.email}`}
                  aria-label="Open account settings"
                  className="flex items-center gap-2 h-10 border border-foreground/30 bg-card px-2.5 shadow-[1px_1px_0px_0px_currentColor] hover:border-primary transition-colors"
                >
                  <div className="size-6 rounded-full bg-primary text-white font-mono text-[10px] font-bold flex items-center justify-center">
                    {getInitials(user.name, user.email)}
                  </div>
                  <span className="font-mono text-xs hidden md:inline truncate max-w-[100px] text-foreground">
                    {user.name.split(" ")[0] || user.email.split("@")[0]}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="Sign out"
                  className="h-10 border border-foreground/30 bg-background px-2.5 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground hover:border-foreground flex items-center transition-colors shadow-[1px_1px_0px_0px_currentColor] disabled:opacity-50"
                >
                  {signingOut ? "…" : "Exit"}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center h-10 border border-foreground bg-primary px-3.5 sm:px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/organizer/new"
              className="hidden sm:inline-flex shrink-0 items-center justify-center gap-1.5 h-10 border border-foreground bg-primary px-3.5 sm:px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Submit</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-3.5"
                aria-hidden="true"
              >
                <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
              </svg>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="grid md:hidden size-10 place-items-center border border-foreground/30 bg-card text-foreground hover:border-primary shadow-[1px_1px_0px_0px_currentColor] cursor-pointer"
            >
              <span className="font-mono text-xs font-bold">
                {mobileMenuOpen ? "✕" : "☰"}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-foreground/30 bg-card px-4 py-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs uppercase tracking-[0.12em]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground/30 bg-background px-3 py-2.5 text-foreground hover:border-primary"
            >
              Radar Index
            </Link>
            <Link
              href="/cities"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground/30 bg-background px-3 py-2.5 text-foreground hover:border-primary"
            >
              City Desks
            </Link>
            <Link
              href="/passport"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground/30 bg-background px-3 py-2.5 text-foreground hover:border-primary"
            >
              DevPassport
            </Link>
            <Link
              href="/organizer/new"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground bg-primary px-3 py-2.5 text-white font-semibold"
            >
              Submit Event
            </Link>
            <Link
              href="/organizer/scan"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground/30 bg-background px-3 py-2.5 text-foreground hover:border-primary"
            >
              Gate Scanner
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-foreground/30 bg-background px-3 py-2.5 text-foreground hover:border-primary"
            >
              Account
            </Link>
          </div>
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full border border-foreground/30 bg-background py-2 font-mono text-xs uppercase text-muted-foreground hover:text-foreground"
            >
              {signingOut ? "Signing out…" : `Sign Out (${user.email})`}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
