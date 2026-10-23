import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eventr — Pakistan’s Developer & Tech Event Hub',
  description: 'Every hackathon, developer conference, workshop, and meetup across Pakistan. Curated by city, sorted by registration deadlines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('theme');
                var isDark = stored ? stored === 'dark' : true;
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (_) {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200 selection:bg-primary selection:text-white">
        <Navbar />

        <div className="flex-1">
          {children}
        </div>

        <footer className="border-t border-foreground/30 bg-background py-8 text-center text-xs text-muted-foreground transition-colors duration-200">
          <div className="mx-auto max-w-[1500px] px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Eventr Pakistan &bull; National Tech Signal
            </span>
            <span>All rights reserved &bull; 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
