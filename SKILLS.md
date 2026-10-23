# SKILLS.md — Implementation Playbooks for Eventr

This document contains step-by-step playbooks for implementing features in Eventr. Agents and developers must follow these patterns to maintain strict architectural and stylistic consistency.

---

## 1. Playbook: `add-page`

When creating a new route in the Next.js 14 App Router:

1. **Create the Route File**: Place `page.tsx` inside `app/<route>/page.tsx`.
2. **Define Metadata**: Export static or dynamic `metadata` for SEO:
   ```tsx
   import type { Metadata } from 'next';

   export const metadata: Metadata = {
     title: 'Page Title — Eventr',
     description: 'Page description matching product specs.',
   };
   ```
3. **Keep Server Component by Default**: Query `prisma` directly inside the async component.
   ```tsx
   import { prisma } from '@/lib/prisma';

   export default async function RoutePage() {
     const data = await prisma.event.findMany();
     return (
       <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
         <h1 className="text-2xl font-bold font-mono text-zinc-100">Page Title</h1>
         {/* Server-rendered content */}
       </main>
     );
   }
   ```
4. **Use Client Boundary Only When Necessary**: Extract interactive islands into subcomponents marked with `'use client'`.

---

## 2. Playbook: `add-api-route`

When creating a backend route handler in `app/api/v1/<resource>/route.ts`:

1. **Standard Handler Structure**:
   ```ts
   import { NextResponse } from 'next/server';
   import { prisma } from '@/lib/prisma';

   export async function POST(req: Request) {
     try {
       const body = await req.json();
       // 1. Validate required fields
       if (!body.title) {
         return NextResponse.json(
           { error: 'Title is required' },
           { status: 400 }
         );
       }

       // 2. Execute Prisma operation
       const result = await prisma.event.create({ data: body });

       // 3. Return JSON with 201 Created
       return NextResponse.json({ data: result }, { status: 201 });
     } catch (err: unknown) {
       console.error('API Error:', err);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```
2. **Always Use `NextResponse.json`**: Never return raw `Response` objects without JSON headers.
3. **Handle PgBouncer / Connection Pool Safely**: Do not open multiple Prisma instances; always import `prisma` from `@/lib/prisma`.

---

## 3. Playbook: `ticket-token-flow`

When implementing RSVP and ticket verification:

1. **Token Generation**:
   Generate an unpredictable token when creating a `Registration`:
   ```ts
   import crypto from 'crypto';

   export function generateTicketToken(): string {
     return `tkt_${crypto.randomBytes(16).toString('hex')}`;
   }
   ```
2. **Storing Registration**:
   ```ts
   const registration = await prisma.registration.create({
     data: {
       userId,
       eventId,
       status: 'CONFIRMED',
       ticketToken: generateTicketToken(),
     },
   });
   ```
3. **Displaying QR on Client (`qrcode.react`)**:
   ```tsx
   'use client';
   import { QRCodeSVG } from 'qrcode.react';

   export function TicketQR({ token }: { token: string }) {
     return (
       <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl inline-block">
         <QRCodeSVG
           value={token}
           size={192}
           bgColor="#18181b"
           fgColor="#10b981"
           level="H"
           includeMargin={false}
         />
       </div>
     );
   }
   ```
4. **Verifying Ticket at `/organizer/scan`**:
   Look up `Registration` by unique `ticketToken`:
   - If not found: return `404 Ticket Invalid`.
   - If `status === 'CHECKED_IN'`: return `409 Already Checked In at ${checkedInAt}`.
   - If valid: update `status = 'CHECKED_IN'`, `checkedInAt = new Date()`.

---

## 4. Playbook: `ai-event-parser`

When extracting event information from poster images:

1. **Direct Native Fetch to Gemini REST API**:
   ```ts
   const apiKey = process.env.GEMINI_API_KEY;
   const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

   export async function parseEventFlyer(imageBase64: string, mimeType: string) {
     // Deterministic Fallback if API key is not configured
     if (!apiKey) {
       return {
         title: 'NED AI & Robotics Hackathon 2026',
         description: 'Inter-university engineering hackathon focusing on robotics automation and computer vision.',
         city: 'Karachi',
         venue: 'NED University Main Campus',
         type: 'Hackathon',
         startTime: new Date('2026-11-15T09:00:00+05:00').toISOString(),
         endTime: new Date('2026-11-16T18:00:00+05:00').toISOString(),
         capacity: 200,
         confidence: 'mock-fallback',
       };
     }

     const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

     const response = await fetch(endpoint, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         contents: [
           {
             parts: [
               {
                 text: 'Extract Pakistani tech event details into JSON with keys: title, description, city (Karachi/Lahore/Islamabad/etc), venue, type (Hackathon/Workshop/Conference/Competition), startTime (ISO 8601), endTime (ISO 8601), capacity (integer or null).'
               },
               {
                 inline_data: {
                   mime_type: mimeType,
                   data: imageBase64,
                 },
               },
             ],
           },
         ],
       }),
     });

     const data = await response.json();
     // Parse response text to JSON safely
     return data;
   }
   ```
2. **No WhatsApp Scraping**: Users submit flyer images or public event URLs directly via the UI form.

---

## 5. Playbook: `match-score`

Client-side affinity matching between student developer tech stacks and events:

1. **Store User Stack in `localStorage`**:
   Key: `eventer_user_skills` (array of strings, e.g. `["React", "TypeScript", "Python", "AI/ML"]`).
2. **Matching Engine (`lib/match.ts`)**:
   ```ts
   export function calculateMatchScore(userSkills: string[], event: { title: string; description: string; type: string }): number {
     if (!userSkills || userSkills.length === 0) return 0;
     const corpus = `${event.title} ${event.description} ${event.type}`.toLowerCase();
     
     let matches = 0;
     for (const skill of userSkills) {
       const term = skill.trim().toLowerCase();
       if (term && corpus.includes(term)) {
         matches++;
       }
     }
     
     const rawScore = (matches / userSkills.length) * 100;
     return Math.min(100, Math.round(rawScore));
   }
   ```
3. **`MatchBadge` UI Indicator**:
   - `score >= 70`: `bg-emerald-500/10 text-emerald-400 border-emerald-500/30` ("High Match")
   - `score >= 35`: `bg-cyan-500/10 text-cyan-400 border-cyan-500/30` ("Good Match")
   - `score < 35`: `bg-zinc-800 text-zinc-400 border-zinc-700` ("General")

---

## 6. Playbook: `ics-export` (RFC 5545 Specification)

To generate valid, downloadable `.ics` calendar files:

1. **RFC 5545 Rules**:
   - **Line Delimiter**: Strict CRLF (`\r\n`).
   - **Line Folding**: Any line exceeding 75 octets must be folded with a CRLF followed by a single space (`\r\n `).
   - **Timestamps**: UTC format `YYYYMMDDTHHMMSSZ`.
   - **Alarms**: Include 24-hour notification alert (`VALARM TRIGGER:-P1D`).
2. **Implementation Example**:
   ```ts
   function formatIcsDate(date: Date): string {
     return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
   }

   function foldLine(line: string): string {
     if (line.length <= 75) return line;
     const chunks: string[] = [];
     chunks.push(line.slice(0, 75));
     let remaining = line.slice(75);
     while (remaining.length > 74) {
       chunks.push(' ' + remaining.slice(0, 74));
       remaining = remaining.slice(74);
     }
     if (remaining.length > 0) chunks.push(' ' + remaining);
     return chunks.join('\r\n');
   }

   export function generateEventIcs(event: {
     id: string;
     title: string;
     description: string;
     venue?: string | null;
     city: string;
     startTime: Date;
     endTime: Date;
   }): string {
     const now = formatIcsDate(new Date());
     const start = formatIcsDate(event.startTime);
     const end = formatIcsDate(event.endTime);
     const location = event.venue ? `${event.venue}, ${event.city}` : event.city;

     const rawLines = [
       'BEGIN:VCALENDAR',
       'VERSION:2.0',
       'PRODID:-//Eventr Pakistan//Tech Radar//EN',
       'CALSCALE:GREGORIAN',
       'METHOD:PUBLISH',
       'BEGIN:VEVENT',
       `UID:${event.id}@eventr.pk`,
       `DTSTAMP:${now}`,
       `DTSTART:${start}`,
       `DTEND:${end}`,
       `SUMMARY:${event.title}`,
       `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
       `LOCATION:${location}`,
       'STATUS:CONFIRMED',
       'BEGIN:VALARM',
       'TRIGGER:-P1D',
       'ACTION:DISPLAY',
       'DESCRIPTION:Reminder: Tech event tomorrow',
       'END:VALARM',
       'END:VEVENT',
       'END:VCALENDAR',
     ];

     return rawLines.map(foldLine).join('\r\n') + '\r\n';
   }
   ```
3. **Response Headers**:
   ```ts
   return new Response(icsContent, {
     headers: {
       'Content-Type': 'text/calendar; charset=utf-8',
       'Content-Disposition': `attachment; filename="event-${event.id}.ics"`,
     },
   });
   ```

---

## 7. Playbook: `design-tokens`

Maintain the dark developer aesthetic throughout all components:

- **Surfaces**:
  - App Canvas: `bg-zinc-950` (`#09090b`)
  - Elevated Cards: `bg-zinc-900` (`#18181b`)
  - Sub-elements & Inputs: `bg-zinc-900/50` or `bg-zinc-950`
  - Borders: `border-zinc-800` (`#27272a`) or `border-zinc-800/80`
- **Typography & Text Colors**:
  - Primary Headings / Highlights: `text-zinc-100` (`#f4f4f5`)
  - Body Text: `text-zinc-300` / `text-zinc-400`
  - Muted Labels / Timestamps: `text-zinc-500`
  - Code / Metadata / Tokens: `font-mono text-xs text-zinc-400`
- **Accent Tokens**:
  - Primary (Success / Tech / Live): `text-emerald-400`, `bg-emerald-500`, `border-emerald-500/20`
  - Secondary (AI / Match / Future): `text-cyan-400`, `bg-cyan-500`, `border-cyan-500/20`
- **Buttons**:
  - Primary Action: `bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium px-4 py-2 rounded-lg transition-colors`
  - Secondary Action: `bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-lg transition-colors`
