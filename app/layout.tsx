import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eventer — Pakistan’s AI-Powered Tech Event Radar',
  description: 'Discover, sync, and register for nationwide hackathons, workshops, and meetups in one tap.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-mono text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Eventer
                </span>
                <span className="text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Radar
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                <Link href="/" className="hover:text-zinc-100 transition-colors">
                  Radar
                </Link>
                <Link href="/cities" className="hover:text-zinc-100 transition-colors">
                  Cities
                </Link>
                <Link href="/passport" className="hover:text-zinc-100 transition-colors">
                  Passport
                </Link>
                <Link href="/organizer/scan" className="hover:text-zinc-100 transition-colors">
                  Check-in
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/organizer/new"
                className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                + Submit Event
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>

        <footer className="border-t border-zinc-800/60 py-8 text-center text-xs text-zinc-500">
          <div className="max-w-6xl mx-auto px-4">
            <p>Eventer — Pakistan&apos;s AI-Powered Tech Event Radar</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
