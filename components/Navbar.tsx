"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Instant check from localStorage (never fails, zero network latency)
    try {
      const saved = localStorage.getItem("eventer_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
    setLoading(false);

    // 2. Background check with cookie session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem("eventer_user", JSON.stringify(data.user));
          } catch {}
        }
      })
      .catch(() => {});
  }, [pathname]);

  function handleSignOut() {
    try {
      localStorage.removeItem("eventer_user");
    } catch {}
    setUser(null);
    fetch("/api/auth/logout").catch(() => {});
  }

  const isRadar = pathname === "/" || pathname === "/events";
  const isCities = pathname === "/cities";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-foreground/30 bg-background/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto grid h-[4.5rem] max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        {/* Wordmark */}
        <Link
          className="group flex min-w-0 min-h-11 items-center gap-2 border-r border-foreground/30 pr-3 sm:gap-3 sm:pr-4 lg:border-r-0"
          href="/"
        >
          <span className="grid size-8 shrink-0 place-items-center border border-foreground bg-primary font-mono text-[10px] font-bold text-white transition-transform group-hover:-rotate-3 shadow-[2px_2px_0px_0px_currentColor]">
            HS
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-2xl font-bold leading-none tracking-[-0.03em] text-foreground group-hover:text-primary transition-colors">
              HackScout
            </span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground md:block">
              Pakistan event intelligence
            </span>
          </span>
        </Link>

        {/* Central Dispatch Marker */}
        <div className="hidden items-center border-x border-foreground/30 px-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex">
          Issue 08.26 &nbsp;/&nbsp; Live edition
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 pl-3 lg:pl-6">
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Primary">
            <Link
              href="/"
              className={`flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isRadar
                  ? "text-primary font-bold underline decoration-2 underline-offset-4"
                  : "text-foreground hover:text-primary"
              }`}
            >
              Radar
            </Link>
            <Link
              href="/cities"
              className={`flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isCities
                  ? "text-primary font-bold underline decoration-2 underline-offset-4"
                  : "text-foreground hover:text-primary"
              }`}
            >
              Cities
            </Link>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* Authentication Control: Exactly ONE Button when logged out */}
            {loading ? (
              <div className="h-10 px-3 border border-foreground/30 flex items-center font-mono text-[10px] text-muted-foreground">
                …
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  title={`Signed in as ${user.name || user.email}`}
                  className="flex items-center gap-2 h-10 border border-foreground/30 bg-card px-2.5 shadow-[1px_1px_0px_0px_currentColor] hover:border-primary transition-colors"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-mono text-xs hidden md:inline truncate max-w-[100px] text-foreground">
                    {user.name?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="h-10 border border-foreground/30 bg-background px-2.5 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground hover:border-foreground flex items-center transition-colors shadow-[1px_1px_0px_0px_currentColor]"
                  title="Sign out"
                >
                  Exit
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center h-10 border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
              >
                Login
              </Link>
            )}

            {/* Submit Event CTA */}
            <Link
              href="/organizer/new"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 h-10 border border-foreground bg-primary px-3.5 sm:px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Submit</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-3.5"
              >
                <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
              </svg>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
