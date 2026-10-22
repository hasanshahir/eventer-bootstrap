import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cities Directory | Pakistan Event Intelligence',
  description: 'Browse tech, hackathon, and developer event hubs across all provinces and regions in Pakistan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-blue-600 selection:text-white transition-colors duration-200">
        <header className="fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200 border-foreground/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto grid h-[4.5rem] max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
            <Link
              className="group flex min-w-0 min-h-11 items-center gap-2 border-r border-foreground/30 pr-3 sm:gap-3 sm:pr-4 lg:border-r-0"
              href="/"
            >
              <span className="grid size-8 shrink-0 place-items-center border border-foreground bg-blue-600 font-mono text-[10px] font-bold text-white transition-transform group-hover:-rotate-3 shadow-[0_0_15px_-3px_rgba(37,99,235,0.6)]">
                HS
              </span>
              <span className="min-w-0">
                <span className="block truncate font-heading text-2xl font-bold leading-none tracking-[-0.03em] text-foreground group-hover:text-blue-500 transition-colors">
                  HackScout
                </span>
                <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground md:block">
                  Pakistan event intelligence
                </span>
              </span>
            </Link>

            <div className="hidden items-center border-x border-foreground/30 px-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex">
              Issue 08.26 &nbsp;/&nbsp; Live edition
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3 pl-3 lg:pl-6">
              <nav className="flex items-center gap-2 sm:gap-5" aria-label="Primary">
                <Link
                  className="flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] hover:text-blue-500 transition-colors"
                  href="/"
                >
                  Radar
                </Link>
                <Link
                  className="flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-500 font-bold transition-colors"
                  href="/cities"
                >
                  Cities
                </Link>
                <Link
                  className="flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] hover:text-blue-500 transition-colors"
                  href="/passport"
                >
                  Passport
                </Link>
                <Link
                  className="hidden sm:flex min-h-11 items-center px-1 text-xs font-semibold uppercase tracking-[0.12em] hover:text-blue-500 transition-colors"
                  href="/organizer/scan"
                >
                  Check-in
                </Link>

                <ThemeToggle />

                <Link
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 h-10 border border-foreground bg-blue-600 px-3.5 sm:px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-500 transition-colors shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]"
                  href="/organizer/new"
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

        <div className="flex-1">
          {children}
        </div>

        <footer className="border-t border-foreground/30 bg-background py-8 text-center text-xs text-muted-foreground transition-colors duration-200">
          <div className="mx-auto max-w-[1500px] px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              HackScout Pakistan &bull; National Tech Signal
            </span>
            <span>All rights reserved &bull; 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
