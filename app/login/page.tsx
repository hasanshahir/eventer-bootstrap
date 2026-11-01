"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const verifySent = searchParams.get("verify") === "1";
  const authError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(verifySent);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    authError ? "Authentication could not be completed. Please try again." : null
  );

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((d: { csrfToken?: string }) => {
        if (d.csrfToken) setCsrfToken(d.csrfToken);
      })
      .catch(() => {});

    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers: Record<string, unknown>) => {
        if (providers && "google" in providers) {
          setHasGoogleProvider(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const tokenRes = csrfToken
        ? { csrfToken }
        : ((await fetch("/api/auth/csrf").then((r) => r.json())) as {
            csrfToken?: string;
          });

      const res = await fetch("/api/auth/signin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        redirect: "manual",
        body: new URLSearchParams({
          csrfToken: tokenRes.csrfToken || "",
          email: cleanEmail,
          callbackUrl,
        }),
      });

      if (res.ok || res.type === "opaqueredirect" || res.status === 302) {
        setMagicLinkSent(true);
      } else {
        setErrorMsg("Could not send magic link. Please try again shortly.");
      }
    } catch {
      setErrorMsg("Network error while sending sign-in link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-background px-4 py-12 pt-24 text-foreground transition-colors">
      <div className="w-full max-w-xl border-2 border-foreground bg-card p-6 sm:p-10 shadow-[4px_4px_0px_0px_currentColor] transition-colors">
        {/* Top Pill Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-foreground/30 bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Passwordless Auth &bull; Pakistan Tech Radar
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="mt-4 mb-7">
          <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Sign in to Eventr
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Access your cryptographic QR event passes, sync your tech stack affinity, and submit campus events across Pakistan. No passwords required.
          </p>
        </div>

        {magicLinkSent ? (
          <div
            role="status"
            className="border-2 border-primary bg-background p-6 space-y-4 shadow-[2px_2px_0px_0px_currentColor]"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              ✓ Check your inbox
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Sign-in link dispatched
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              We sent a one-time magic sign-in link to{" "}
              <strong className="text-foreground font-mono">
                {email || "your email address"}
              </strong>
              . Click the link in that email to sign in. The link expires in 15 minutes.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="h-10 border border-foreground bg-card px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Use another email
              </button>
              <Link
                href="/"
                className="inline-flex items-center h-10 border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-colors"
              >
                Return to Radar &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Official Google OAuth 2.0 Form (PKCE + State via Auth.js) */}
            {hasGoogleProvider && (
              <>
                <form action="/api/auth/signin/google" method="POST">
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <button
                    type="submit"
                    className="flex w-full min-h-12 items-center justify-center gap-3 border border-foreground bg-background px-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground hover:border-primary hover:bg-foreground/5 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.7 7.4l3.7 2.9C6.3 7.5 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-2 .4-2.7L1.7 6.4C.6 8.6 0 10.2 0 12s.6 3.4 1.7 5.6l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2.5-6.6-5.3L1.7 16C3.5 19.8 7.4 23 12 23z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-foreground/20" />
                  <span className="absolute bg-card px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    OR EMAIL MAGIC LINK
                  </span>
                </div>
              </>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="border border-red-500 bg-red-500/10 p-3 font-mono text-xs text-red-500"
              >
                {errorMsg}
              </div>
            )}

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email-input"
                  className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                >
                  Developer or University Email
                </label>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.pk"
                  className="w-full h-12 border border-foreground/40 bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
                <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">
                  We will email you an encrypted one-tap sign-in link. After your first login, you can complete your university profile at{" "}
                  <Link href="/account" className="underline hover:text-primary">
                    /account
                  </Link>
                  .
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full min-h-12 items-center justify-center gap-2 border border-foreground bg-primary px-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {submitting ? "Sending Magic Link…" : "Email me a sign-in link →"}
                </span>
              </button>
            </form>

            <div className="border-t border-foreground/20 pt-4 text-center">
              <p className="font-mono text-[11px] text-muted-foreground">
                By signing in, you agree to Eventr&apos;s{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-background p-8 font-mono text-xs uppercase text-muted-foreground">
          Loading sign-in desk…
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
