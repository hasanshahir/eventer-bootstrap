# BACKLOG.md — Eventr Feature Implementation Backlog

This backlog contains 10 atomic, ordered, self-contained tasks designed to be handed to the DevMarketplace coding agent one at a time. Each task is formulated as a ready-to-paste prompt of 2 to 4 sentences.

---

### Task 1: Event cards + dark restyle of the home feed
```text
Create an EventCard component in `components/EventCard.tsx` that displays an event's title, description, city, venue, type badge, formatted dates, and capacity in a dark themed card with `bg-zinc-900` and `border-zinc-800`. Update `app/page.tsx` to render these cards in a responsive grid instead of the plain unstyled list, preserving the Prisma server-side query. Add an empty state when no events exist and run `npx tsc --noEmit` to verify type safety.
```

---

### Task 2: Filter bar + stack selector with localStorage
```text
Create a client-side FilterBar component in `components/FilterBar.tsx` that allows users to filter events by city (All, Karachi, Lahore, Islamabad) and event type (All, Hackathon, Conference, Competition). Include a tech stack selector where developers can toggle or add skills (e.g., React, Python, AI/ML, Rust) that persist in browser `localStorage` under `eventer_user_skills`. Integrate this filter bar into `app/page.tsx` to filter the visible events in real time without page reloads, and verify with `npx tsc --noEmit`.
```

---

### Task 3: lib/match.ts + MatchBadge
```text
Implement the client-side matching algorithm in `lib/match.ts` that computes an affinity score (0–100%) between the user's stored tech stack and an event's title, type, and description. Create a `components/MatchBadge.tsx` component that renders the percentage score with emerald glow styling for high matches (>=70%), cyan for medium matches (>=35%), and zinc for low matches. Wire MatchBadge into EventCard so each event prominently shows its personalized match percentage, and verify types with `npx tsc --noEmit`.
```

---

### Task 4: POST/GET /api/v1/registrations
```text
Create the API route handler `app/api/v1/registrations/route.ts` supporting GET and POST requests. The POST handler should accept `userId` (or create a guest demo user if absent) and `eventId`, ensure the user is not already registered, generate a unique `ticketToken` via crypto, and create a Registration record with `CONFIRMED` status. The GET handler should accept a `userId` query parameter and return all registrations for that user including event details, accompanied by robust error handling and verified with `npx tsc --noEmit`.
```

---

### Task 5: RsvpButton
```text
Create an interactive `components/RsvpButton.tsx` client component that receives `eventId` and handles 1-tap registration by sending a POST request to `/api/v1/registrations`. Manage loading, registered, and error states gracefully while storing successful ticket tokens in `localStorage` under `eventer_tickets`. Mount the RsvpButton on each EventCard, ensuring instantaneous visual feedback when a user secures their ticket, and verify with `npx tsc --noEmit`.
```

---

### Task 6: /passport with QR
```text
Implement the attendee passport page in `app/passport/page.tsx` that retrieves the user's saved registration ticket tokens from `localStorage` and displays their active passes. For each registered event, render a rich ticket card containing event details, registration status badge, and a high-resolution QR code rendered via `qrcode.react`. Provide a clean empty state guiding users back to the radar feed if they have no registered events, and verify with `npx tsc --noEmit`.
```

---

### Task 7: QR check-in at /organizer/scan + /api/v1/checkin
```text
Create `app/api/v1/checkin/route.ts` which accepts `ticketToken` in a POST payload, validates that the registration exists, verifies it is not already checked in, and marks `status: 'CHECKED_IN'` with the current timestamp. In `app/organizer/scan/page.tsx`, build a camera-based scanner interface using `html5-qrcode` that continuously scans QR codes, calls the check-in API, and displays an emerald success banner with attendee details or a red warning if invalid. Test camera cleanup on unmount and verify compilation with `npx tsc --noEmit`.
```

---

### Task 8: /api/v1/events/[id]/ics
```text
Create the dynamic iCalendar route handler in `app/api/v1/events/[id]/ics/route.ts` that fetches the event by ID and returns a valid RFC 5545 `.ics` file. Implement strict CRLF line endings, 75-octet line folding, UTC timestamps, and a 24-hour reminder alarm (`VALARM TRIGGER:-P1D`) with `Content-Type: text/calendar; charset=utf-8`. Add an 'Add to Calendar' button on each EventCard that links directly to this endpoint for one-click download, and run `npx tsc --noEmit` to verify.
```

---

### Task 9: /api/v1/events/ai-parse + /organizer/new
```text
Create the API route `app/api/v1/events/ai-parse/route.ts` that accepts an uploaded flyer image (base64) and queries Google Gemini 1.5 via native fetch to extract structured event details, with a deterministic mock fallback if `GEMINI_API_KEY` is unset. In `app/organizer/new/page.tsx`, build an event submission studio featuring a drag-and-drop poster upload zone that auto-fills form fields (title, city, dates, venue, type, capacity) from the AI parse response. Allow organizers to review, adjust, and save the event into PostgreSQL via Prisma, and verify types with `npx tsc --noEmit`.
```

---

### Task 10: /cities
```text
Upgrade `app/cities/page.tsx` into a full nationwide city radar by grouping events from Prisma by Pakistani city (Karachi, Lahore, Islamabad, and others). Display city hub cards with active event counts, upcoming dates, and direct links to pre-filtered radar feeds for each metropolitan area. Ensure full responsive design matching the dark developer palette and complete the implementation by running `npx tsc --noEmit`.
```
