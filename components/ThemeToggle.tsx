"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : document.documentElement.classList.contains("dark");
    const initial = isDark ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(t: "dark" | "light") {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  if (!mounted) {
    return (
      <div
        className="flex h-10 items-center justify-center border border-foreground/30 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground opacity-60"
        aria-hidden="true"
      >
        <span>THEME</span>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light newspaper mode" : "Switch to dark mode"}
      className="flex h-10 items-center gap-1.5 border border-foreground bg-card px-2.5 sm:px-3 text-foreground hover:bg-foreground hover:text-background transition-colors focus:outline-none focus:ring-1 focus:ring-primary shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
    >
      {isDark ? (
        <>
          <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="font-mono text-[10px] font-bold tracking-[0.1em]">LIGHT</span>
        </>
      ) : (
        <>
          <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="font-mono text-[10px] font-bold tracking-[0.1em]">DARK</span>
        </>
      )}
    </button>
  );
}
