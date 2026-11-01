import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eventr — Pakistan’s Developer & Tech Event Hub",
  description:
    "Every hackathon, developer conference, workshop, and meetup across Pakistan. Curated by city, sorted by registration deadlines.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let sessionUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    city?: string | null;
  } | null = null;

  try {
    const session = await auth();
    if (session?.user?.id && session.user.email) {
      sessionUser = {
        id: session.user.id,
        name: session.user.name || session.user.email.split("@")[0],
        email: session.user.email,
        role: session.user.role || "USER",
        city: session.user.city ?? null,
      };
    }
  } catch {
    sessionUser = null;
  }

  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
      suppressHydrationWarning
    >
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
                localStorage.removeItem('eventr_user');
              } catch (_) {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200 selection:bg-primary selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:border-2 focus:border-foreground focus:bg-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:uppercase focus:text-white"
        >
          Skip to main content
        </a>

        <Navbar initialUser={sessionUser} />

        <div id="main-content" className="flex-1">
          {children}
        </div>

        <footer className="border-t border-foreground/30 bg-background py-8 text-center text-xs text-muted-foreground transition-colors duration-200">
          <div className="mx-auto max-w-[1500px] px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Eventr Pakistan &bull; National Tech Signal
            </span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary underline-offset-4 hover:underline">
                Terms
              </Link>
              <span>All rights reserved &bull; 2026</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
