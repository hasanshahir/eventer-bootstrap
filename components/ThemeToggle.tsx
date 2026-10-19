"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eventer_theme");
      const isDark =
        stored === "dark" ||
        (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (isDark) {
        document.documentElement.classList.add("dark");
        setTheme("dark");
      } else {
        document.documentElement.classList.remove("dark");
        setTheme("light");
      }
    } catch {}
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("eventer_theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("eventer_theme", "light");
      } catch {}
    }
  }

  if (!mounted) {
    return (
      <div className="h-10 w-24 border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === "dark" ? "Blue & White (Light)" : "Blue & Black (Dark)"}`}
      className="inline-flex items-center justify-center gap-1.5 h-10 px-3 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all font-mono text-xs uppercase tracking-wider shadow-sm"
      aria-label="Toggle theme mode"
    >
      {theme === "dark" ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 256 256"
            className="size-4 text-amber-400"
          >
            <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66a8,8,0,0,0,11.32-11.32l-16-16a8,8,0,0,0-11.32,11.32Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM197.66,58.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32Zm-11.32,128a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM240,120H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16ZM40,120H16a8,8,0,0,0,0,16H40a8,8,0,0,0,0-16Zm96,96a8,8,0,0,0-16,0v24a8,8,0,0,0,16,0Z" />
          </svg>
          <span className="hidden sm:inline text-[10px] font-bold text-blue-400">Blue/Dark</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 256 256"
            className="size-4 text-blue-600"
          >
            <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-21.14,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM136,208A88,88,0,0,1,53.48,87.67,88.76,88.76,0,0,1,88.2,63.15,104.14,104.14,0,0,0,192.85,167.8,88.76,88.76,0,0,1,168.33,202.52,87.35,87.35,0,0,1,136,208Z" />
          </svg>
          <span className="hidden sm:inline text-[10px] font-bold text-blue-600">Blue/White</span>
        </>
      )}
    </button>
  );
}
