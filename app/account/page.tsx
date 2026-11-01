"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STACK_OPTIONS } from "@/lib/match";

const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Peshawar",
  "Multan",
  "Quetta",
  "Hyderabad",
  "Sukkur",
];

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  university: string;
  rollNumber: string;
  phone: string;
  city: string;
  githubHandle: string;
  techStack: string[];
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/account")
      .then(async (res) => {
        if (res.status === 401) {
          setUnauthenticated(true);
          return null;
        }
        return res.json() as Promise<{ ok?: boolean; profile?: ProfileData }>;
      })
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
        }
      })
      .catch(() => setErrorMsg("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          university: profile.university,
          rollNumber: profile.rollNumber,
          phone: profile.phone,
          city: profile.city,
          githubHandle: profile.githubHandle,
          techStack: profile.techStack,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatusMsg("Profile saved and phone number encrypted at rest.");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Could not update profile.");
      }
    } catch {
      setErrorMsg("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/v1/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error || "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      setErrorMsg("Network error while deleting account.");
      setDeleting(false);
    }
  }

  function toggleSkill(skill: string) {
    if (!profile) return;
    const exists = profile.techStack.includes(skill);
    const next = exists
      ? profile.techStack.filter((s) => s !== skill)
      : [...profile.techStack, skill];
    setProfile({ ...profile, techStack: next });
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-[4.5rem] transition-colors">
      <header className="border-b-2 border-foreground/30 bg-card px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Developer Identity &bull; Data Sovereignty
          </p>
          <h1 className="mt-3 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Account & Privacy Controls
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
            Manage your developer profile, university credentials, encrypted contact details, data export, and account deletion.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 lg:px-12 space-y-10">
        {loading ? (
          <div className="border border-foreground/30 bg-card p-12 text-center font-mono text-xs uppercase text-muted-foreground">
            Loading developer account…
          </div>
        ) : unauthenticated || !profile ? (
          <div className="border-2 border-foreground bg-card p-10 text-center space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Sign in required
            </h2>
            <p className="font-mono text-xs text-muted-foreground max-w-[45ch] mx-auto">
              Please sign in with Google or an email magic link to view or manage your Eventr developer profile.
            </p>
            <Link
              href="/login?callbackUrl=/account"
              className="inline-flex items-center h-11 border border-foreground bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
            >
              Sign In &rarr;
            </Link>
          </div>
        ) : (
          <>
            {statusMsg && (
              <div
                role="status"
                className="border border-primary bg-primary/10 p-4 font-mono text-xs text-primary font-semibold"
              >
                ✓ {statusMsg}
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="border border-red-500 bg-red-500/10 p-4 font-mono text-xs text-red-500 font-semibold"
              >
                ✕ {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSave}
              className="border-2 border-foreground bg-card p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_currentColor]"
            >
              <div className="flex items-center justify-between border-b border-foreground/20 pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Developer Dossier
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    {profile.email} &bull; Role: {profile.role}
                  </p>
                </div>
                <Link
                  href="/passport"
                  className="h-10 inline-flex items-center border border-foreground/40 bg-background px-4 font-mono text-xs font-semibold uppercase text-foreground hover:border-primary"
                >
                  View DevPassport &rarr;
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="acc-fullname"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="acc-fullname"
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="acc-city"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    Primary City Hub
                  </label>
                  <select
                    id="acc-city"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="acc-university"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    University / Organization
                  </label>
                  <input
                    id="acc-university"
                    type="text"
                    value={profile.university}
                    onChange={(e) =>
                      setProfile({ ...profile, university: e.target.value })
                    }
                    placeholder="e.g. NED University / FAST-NUCES"
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="acc-roll"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    University Roll Number (Optional)
                  </label>
                  <input
                    id="acc-roll"
                    type="text"
                    value={profile.rollNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, rollNumber: e.target.value })
                    }
                    placeholder="e.g. CS-22041"
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="acc-phone"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    Mobile Number (Encrypted AES-256-GCM at rest)
                  </label>
                  <input
                    id="acc-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="+92 300 0000000"
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="acc-github"
                    className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-1.5"
                  >
                    GitHub Handle
                  </label>
                  <input
                    id="acc-github"
                    type="text"
                    value={profile.githubHandle}
                    onChange={(e) =>
                      setProfile({ ...profile, githubHandle: e.target.value })
                    }
                    placeholder="e.g. hasanshahir"
                    className="w-full h-11 border border-foreground/40 bg-background px-3.5 font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-2">
                  Tech Stack Affinity
                </span>
                <div className="flex flex-wrap gap-2">
                  {STACK_OPTIONS.map((skill) => {
                    const selected = profile.techStack.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleSkill(skill)}
                        className={`h-9 px-3 border font-mono text-xs transition-colors cursor-pointer ${
                          selected
                            ? "border-primary bg-primary text-white font-bold"
                            : "border-foreground/30 bg-background text-foreground hover:border-primary"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="h-11 border border-foreground bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : "Save Profile Changes"}
              </button>
            </form>

            {/* Data Export & Account Deletion */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border border-foreground/30 bg-card p-6 space-y-3 shadow-[2px_2px_0px_0px_currentColor]">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Export My Data
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Download a complete machine-readable JSON archive of your Eventr profile, decrypted contact details, event registrations, and organizer memberships.
                </p>
                <a
                  href="/api/v1/account/export"
                  download
                  className="inline-flex items-center h-10 border border-foreground bg-background px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  Download JSON Archive &darr;
                </a>
              </div>

              <div className="border border-red-500/50 bg-card p-6 space-y-3 shadow-[2px_2px_0px_0px_currentColor]">
                <h3 className="font-heading text-xl font-bold text-red-500">
                  Delete My Account
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Permanently erase your user record, sessions, and event registrations from Eventr&apos;s database. This action is irreversible.
                </p>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="h-10 border border-red-500 bg-red-500/10 px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Delete Account…
                  </button>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="h-10 border border-red-600 bg-red-600 px-4 font-mono text-xs font-bold uppercase text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? "Deleting…" : "Confirm Permanent Deletion"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-10 border border-foreground/30 bg-background px-3 font-mono text-xs uppercase text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

