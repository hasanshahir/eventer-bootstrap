"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-mono text-sm">
        <div className="max-w-md w-full border-2 border-white/40 p-8 space-y-4">
          <p className="text-red-400 font-bold uppercase tracking-wider text-xs">
            Critical Application Fault
          </p>
          <h1 className="text-2xl font-bold font-serif">Signal Interrupted</h1>
          <p className="text-zinc-400 text-xs leading-relaxed">
            A fatal exception occurred. The incident has been recorded for operations review.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="border border-white bg-blue-600 px-4 py-2 font-bold uppercase text-xs hover:bg-blue-500 text-white"
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  );
}

