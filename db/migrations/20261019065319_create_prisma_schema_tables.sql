CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'CHECKED_IN');

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "university" TEXT,
  "rollNumber" TEXT,
  "city" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Organizer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "venue" TEXT,
  "type" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER,
  "organizerId" TEXT NOT NULL REFERENCES "Organizer"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Event_city_idx" ON "Event"("city");
CREATE INDEX IF NOT EXISTS "Event_startTime_idx" ON "Event"("startTime");
CREATE INDEX IF NOT EXISTS "Event_organizerId_idx" ON "Event"("organizerId");

CREATE TABLE IF NOT EXISTS "Registration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "ticketToken" TEXT NOT NULL UNIQUE,
  "checkedInAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_userId_eventId_key" ON "Registration"("userId", "eventId");
CREATE INDEX IF NOT EXISTS "Registration_userId_idx" ON "Registration"("userId");
CREATE INDEX IF NOT EXISTS "Registration_eventId_idx" ON "Registration"("eventId");
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");

CREATE TABLE IF NOT EXISTS "Team" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Team_eventId_idx" ON "Team"("eventId");
