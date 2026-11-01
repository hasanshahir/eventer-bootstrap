# Eventr — Production Readiness & Operations Runbook

## 1. Baseline ("Before" Audit State)

Recorded on branch `chore/production-readiness` from commit `a2e54f1` (`hasanshahir/eventer-bootstrap`):

### 1.1 Baseline `npx tsc --noEmit`
- **Result**: `EXIT 0` (passed only because 17 `(prisma as any)` and `req.json() as any` casts bypassed strict checking).

### 1.2 Baseline `npm run build`
- **Result**: `EXIT 0` (`Next.js 14.2.24`), compiled 10 static/dynamic pages.
- **Issues observed during build**:
  - Exposed unauthenticated write routes (`/api/seed`, `/api/discover`, `/api/v1/sync`, `/api/v1/events/sync`).
  - `/organizer/scan` First Load JS was `197 kB` due to unmaintained `html5-qrcode`.

### 1.3 Baseline `npm audit`
- **Result**: `EXIT 1` — **3 vulnerabilities (1 moderate, 1 high, 1 critical)**:
  - `next@14.2.24` (**Critical**): Affected by `CVE-2025-29927` (`GHSA-f82v-jwr5-mffw` middleware authorization bypass) plus multiple SSRF, cache poisoning, and RSC DoS advisories.
  - `postcss <=8.5.22` (**High**): `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`.
  - `postcss-selector-parser <6.1.5` (**Moderate**): `GHSA-rj75-hqrm-r3gf`.

---

## 2. Phase 0 & Phase 1 Verification Results ("After" Checkpoint)

- **`npm run typecheck`**: `EXIT 0` (Zero `(prisma as any)` or `: any` casts across the entire repository).
- **`npm run lint`**: `EXIT 0` (ESLint 9 flat config with `@typescript-eslint/no-explicit-any: "error"`).
- **`npm test`**: `EXIT 0` (`18/18` unit & integration tests passing in `tests/unit/security-phase1.test.ts` and `tests/integration/routes-phase1.test.ts`).
- **`npm run build`**: `EXIT 0` (`Next.js 16.4.3`, Prisma Client v5.22.0).
- **`npm audit --audit-level=high`**: `EXIT 0` (`0 high, 0 critical` vulnerabilities).

---

## 3. Audit Findings Resolution Tracker (Phase 0 & Phase 1)

| ID | Category | Finding Summary | Phase | Status | Evidence / Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S-01** | Security | Fake password auth (`mode:"login"` logs in by email alone) | Phase 1 | ✅ Resolved | Deleted `app/api/auth/email/route.ts`; replaced `/login` with Google OAuth + Resend Magic Link via Auth.js v5 (`lib/auth.ts`). |
| **S-02** | Security | Unsigned `eventr_auth` JSON cookie (`httpOnly: false`) | Phase 1 | ✅ Resolved | Replaced with `httpOnly`, `sameSite=lax`, `secure` database-backed session cookies via `@auth/prisma-adapter`. |
| **S-03** | Security | Fake in-page Google modal accepting arbitrary emails | Phase 1 | ✅ Resolved | Removed fake Google modal from `app/login/page.tsx`; wired directly to `signIn("google")`. |
| **S-04** | Security | IDOR on `GET /api/v1/registrations?email=` & unauthenticated `POST` | Phase 1 | ✅ Resolved | `app/api/v1/registrations/route.ts` ignores `?email=` and uses `session.user.id` from `requireUser()`; `POST` requires auth + rate limit + Turnstile + serializable capacity check + HS256 JWT ticket. |
| **S-05** | Security | Unauthenticated, non-atomic `POST /api/v1/checkin` leaking full rows | Phase 1 | ✅ Resolved | `app/api/v1/checkin/route.ts` enforces `requireOrganizerForEvent()`, verifies HS256 JWT (`lib/tickets.ts`), executes atomic `updateMany({ where: { id, status: "CONFIRMED" } })`, and returns minimal attendee/event fields. |
| **S-06** | Security | Unauthenticated mutating endpoints (`/api/seed`, `/api/discover`, `/api/v1/sync`) | Phase 1 | ✅ Resolved | Deleted `app/api/seed`, `app/api/discover`, `app/api/v1/sync`, and `app/api/v1/events/sync`. Moved seeding exclusively to `prisma/seed.ts`. |
| **S-07** | Security | Organizer impersonation via free-text organizer name | Phase 1 | ✅ Resolved | `POST /api/v1/events` resolves `organizerId` strictly via `resolveUserOrganizer(user.id)` (`OrganizerMember` membership), never free text, and sets `status = PENDING`. |
| **S-08** | Security | Auto-login as `demoUser` ("Hasan Shahir") persisting after sign-out | Phase 1 | ✅ Resolved | Deleted `lib/demoUser.ts` and removed all `localStorage` fallback logic across `Navbar.tsx`, `passport/page.tsx`, `RsvpButton.tsx`, and `Feed.tsx`. |
| **S-09** | Security | Weak OAuth callback (no state/PKCE, header-derived redirect URI) | Phase 1 | ✅ Resolved | Deleted `app/api/auth/google` & `app/api/auth/callback/google`; Auth.js `Google` provider enforces `checks: ["pkce", "state"]` and pinned `AUTH_URL`. |
| **S-10** | Security | Vulnerable Next.js `14.2.24` (`CVE-2025-29927`) & PostCSS advisories | Phase 0 | ✅ Resolved | Upgraded `next` to `16.4.3`; `npm audit --audit-level=high` exits `0` (`0 high, 0 critical`). |
| **S-11** | Security | Raw `err.message` leaked to clients in HTTP 500 responses | Phase 1 | ✅ Resolved | Standardized all API routes on `apiError()` / `handleApiException()` (`lib/api-error.ts`) with correlation `requestId` and generic 500 messages. |
| **S-12** | Security | Missing rate limiting, Turnstile, and security headers (CSP/HSTS) | Phase 1 | ✅ Resolved | Added `lib/ratelimit.ts`, `lib/turnstile.ts`, and security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, route-scoped `Permissions-Policy`) in `next.config.mjs`. |
| **S-13** | Security | Phone stored in `User.rollNumber`; DiceBear avatar leak; no privacy/terms/delete | Phase 1 | ✅ Resolved | Added `User.phoneEncrypted` (`AES-256-GCM` in `lib/crypto.ts`) + `scripts/migrate-phone-rollnumber.ts`, replaced DiceBear with local initials avatar, added `/privacy`, `/terms`, `/account`, `DELETE /api/v1/account`, and `GET /api/v1/account/export`. |
| **S-14** | Security | Gemini API key in URL query string; no upload validation/rate limit | Phase 1 | ✅ Resolved | `app/api/v1/events/ai-parse/route.ts` uses `x-goog-api-key` header, `GEMINI_MODEL` env (`gemini-2.5-flash`), auth + rate limit (10/hr), MIME/size validation, and returns 503 instead of fake mock data on failure. |
| **F-11** | Features | `/api/auth/[...nextauth]` relative redirect throws in Next 14 | Phase 1 | ✅ Resolved | Replaced broken stub with real Auth.js v5 `handlers` in `app/api/auth/[...nextauth]/route.ts`. |
| **D-01** | Platform | Missing tests, CI, ESLint, Prettier, `typecheck`, `engines`, `LICENSE` | Phase 0 | ✅ Resolved | Added `LICENSE` (MIT), `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, `lighthouserc.json`, and `.github/workflows/ci.yml` (with Postgres service container). |
| **D-04** | Platform | `lib/prisma.ts` mutating `process.env.DATABASE_URL`; `as any` casts | Phase 0/1 | ✅ Resolved | Removed `process.env` mutation in `lib/prisma.ts`, added `directUrl` to `prisma/schema.prisma`, and eliminated all `(prisma as any)` casts. |
| **D-05** | Platform | Missing Zod env validation; unused env vars | Phase 0 | ✅ Resolved | Added `lib/env.ts` with Zod validation and cleaned `.env.example`. |
