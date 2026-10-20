import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eventer — Pakistan’s AI-Powered Tech Event & Hackathon Radar',
  description: 'Track all developer hackathons, conferences, and competitions across Pakistan with deadlines and direct registration links.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-500 dark:selection:text-black">
        {/* Editorial Masthead */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#030712]/90 backdrop-blur transition-colors">
          <div className="mx-auto grid h-[4.5rem] max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
            {/* Wordmark & Emblem */}
            <Link
              className="group flex min-w-0 min-h-11 items-center gap-2 border-r border-slate-200 dark:border-zinc-800 pr-3 sm:gap-3 sm:pr-4 lg:border-r-0"
              href="/"
            >
              <span className="grid size-8 shrink-0 place-items-center border border-blue-700 dark:border-blue-400 bg-blue-600 dark:bg-blue-500 font-mono text-[10px] font-bold text-white dark:text-black transition-transform group-hover:-rotate-3 shadow-sm">
                EV
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Eventer
                </span>
                <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 md:block">
                  Pakistan event intelligence
                </span>
              </span>
            </Link>

            {/* Central Dispatch Issue Marker */}
            <div className="hidden items-center border-x border-slate-200 dark:border-zinc-800 px-7 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500 lg:flex">
              Issue 10.26 &nbsp;/&nbsp; Live radar edition
            </div>

            {/* Primary Navigation & Theme Toggle */}
            <div className="flex items-center justify-end gap-3 sm:gap-6 pl-3 lg:pl-6">
              <nav className="flex items-center gap-3 sm:gap-6" aria-label="Primary">
                <Link
                  className="flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 transition-colors"
                  href="/"
                >
                  Radar Feed
                </Link>
                <Link
                  className="flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 transition-colors"
                  href="/cities"
                >
                  City Desks
                </Link>

                <ThemeToggle />
              </nav>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 pt-[4.5rem]">
          {children}
        </div>

        {/* Editorial Sub-Footer */}
        <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#030712] py-8 text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors">
          <div className="mx-auto max-w-[1500px] px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span>Eventer Pakistan &bull; Automated Tech Event Radar</span>
            <span>Direct Social Ingestion &bull; 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
