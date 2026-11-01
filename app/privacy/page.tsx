import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Eventr Pakistan",
  description: "How Eventr collects, encrypts, and protects developer and student data across Pakistan.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-[4.5rem]">
      <main className="mx-auto max-w-[900px] px-4 py-14 sm:px-8 space-y-8">
        <div className="border-b-2 border-foreground/30 pb-6">
          <span className="inline-block border border-primary bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Draft &bull; To Be Reviewed by Legal Counsel
          </span>
          <h1 className="mt-4 font-heading text-4xl sm:text-6xl font-bold text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Effective Date: November 1, 2026 &bull; Jurisdiction: Pakistan
          </p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            1. Information We Collect
          </h2>
          <p>
            Eventr collects only the information necessary to provide event discovery, one-tap registration, and cryptographic QR check-in passes:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Account identity (name and email address via Google OAuth or magic link).</li>
            <li>Optional student/developer profile details (university, roll number, city, GitHub handle, and tech stack tags).</li>
            <li>Optional mobile phone number, which is encrypted at rest using AES-256-GCM (`User.phoneEncrypted`) and is never exposed in public APIs.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            2. How We Share Information with Event Organizers
          </h2>
          <p className="text-muted-foreground">
            When you RSVP for an on-platform event, only the verified organizer(s) of that specific event can view your attendee registration record and check in your pass at the venue gate. We do not sell personal data or leak user identifiers to third-party avatar services.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            3. Data Export & Account Deletion
          </h2>
          <p className="text-muted-foreground">
            You can export a complete JSON copy of your personal data or permanently delete your account and all associated registrations at any time from your{" "}
            <Link href="/account" className="text-primary underline">
              Account Settings (/account)
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

