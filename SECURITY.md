# Security Policy

Eventr takes the security and privacy of its users, attendees, and organizers seriously. This document outlines our vulnerability reporting policy and security architecture.

---

## Supported Versions

| Version | Supported | Security Updates |
| :--- | :--- | :--- |
| `1.0.x` (Next.js 16.4.3) | Yes | Active security patches |
| `< 1.0.0` (Next.js 14.x) | No | Deprecated / Vulnerable to CVE-2025-29927 |

---

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not disclose it publicly via GitHub issues or discussions**.

Instead, email the core engineering team directly:
- **Email**: `security@eventr.pk` (or contact `hasanshahir@gmail.com`)
- **Subject**: `[SECURITY VULNERABILITY] <Component/Endpoint>`

### What to include:
1. Detailed description of the vulnerability and its potential impact.
2. Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
3. Any suggested remediations or mitigations.

We will acknowledge receipt within 24 hours, provide regular progress updates, and coordinate responsible disclosure upon remediation.

---

## Security Architecture Highlights

1. **Authentication & Session Tokens**:
   - Sessions are managed by Auth.js v5 using encrypted JWE tokens stored in `__Secure-authjs.session-token` or `authjs.session-token` with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
   - Never exposes plaintext session state or credentials to client JavaScript.

2. **Personal Identifiable Information (PII)**:
   - Contact phone numbers and WhatsApp handles are encrypted at rest using **AES-256-GCM** with unique 12-byte initialization vectors (IVs) and 16-byte authentication tags.

3. **Tamper-Evident Attendee Passes**:
   - Ticket tokens are signed **HS256 JWTs** containing user ID, event ID, registration ID, and a single-use nonce.
   - Check-in scanner validates the signature before verifying attendance and marks the ticket invalid for reuse.

4. **Concurrency & Anti-Overbooking**:
   - All seat allocations and cancellations run under PostgreSQL `Serializable` isolation with bounded retry on conflict (`P2034`), preventing race conditions.

5. **Injection Mitigation**:
   - Organizer attendee CSV exports sanitize spreadsheet formula injection prefixes (`=`, `+`, `-`, `@`) with prepended single quotes.
   - Prisma ORM parametrizes all database queries.
   - Content Security Policy (CSP) restricts script and connect origins.

