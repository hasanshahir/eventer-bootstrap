import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Eventr Pakistan",
  description: "Terms of use for Eventr, Pakistan's developer and student tech event radar.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-[4.5rem]">
      <main className="mx-auto max-w-[900px] px-4 py-14 sm:px-8 space-y-8">
        <div className="border-b-2 border-foreground/30 pb-6">
          <span className="inline-block border border-primary bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Draft &bull; To Be Reviewed by Legal Counsel
          </span>
          <h1 className="mt-4 font-heading text-4xl sm:text-6xl font-bold text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Effective Date: November 1, 2026 &bull; Pakistan (PKT / UTC+5)
          </p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            1. Platform Purpose & External Host Links
          </h2>
          <p className="text-muted-foreground">
            Eventr indexes public developer hackathons, conferences, workshops, and campus competitions across Pakistan. Events aggregated from external hosts (such as Devpost, Google Developer Groups, and Luma) link directly to their original registration pages and remain governed by the respective organizer&apos;s terms.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            2. Organizer Submissions & Anti-Impersonation
          </h2>
          <p className="text-muted-foreground">
            Community event submissions require an authenticated account and are attributed strictly to your authorized organizer membership. All community submissions enter a moderation queue (`PENDING`) before appearing on the public radar. Impersonating a university society or community chapter is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            3. Acceptable Use & Rate Limits
          </h2>
          <p className="text-muted-foreground">
            Automated scraping, credential stuffing, or forging QR passes is prohibited. Please review our{" "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>{" "}
            for details on how we handle personal data.
          </p>
        </section>
      </main>
    </div>
  );
}

