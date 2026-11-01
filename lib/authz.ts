import type { Role } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { apiError } from "./api-error";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  city?: string | null;
  university?: string | null;
  image?: string | null;
}

export class AuthzError extends Error {
  public readonly status: 401 | 403 | 404;

  constructor(message: string, status: 401 | 403 | 404 = 401) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

export function authzResponse(err: unknown): NextResponse | null {
  if (err instanceof AuthzError) {
    return apiError(err.message, err.status);
  }
  return null;
}

/**
 * Requires an active authenticated database session via Auth.js `auth()`.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new AuthzError("Authentication required. Please sign in.", 401);
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email.split("@")[0],
    role: session.user.role || "USER",
    city: session.user.city ?? null,
    university: session.user.university ?? null,
    image: session.user.image ?? null,
  };
}

/**
 * Requires the authenticated user to hold one of the allowed roles.
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthzError("Forbidden: insufficient role permissions.", 403);
  }
  return user;
}

/**
 * Resolves (or provisions) the authenticated user's Organizer record via `OrganizerMember`.
 * Never trusts free-text organizer names from request bodies (fixes S-07).
 */
export async function resolveUserOrganizer(userId: string): Promise<{
  id: string;
  name: string;
  verified: boolean;
}> {
  const existingMembership = await prisma.organizerMember.findFirst({
    where: { userId },
    include: { organizer: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingMembership?.organizer) {
    return {
      id: existingMembership.organizer.id,
      name: existingMembership.organizer.name,
      verified: existingMembership.organizer.verified,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, fullName: true, email: true },
  });

  const displayName =
    dbUser?.fullName || dbUser?.name || dbUser?.email?.split("@")[0] || "Developer";
  const orgName = `${displayName} Community`;
  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase || "community"}-${userId.slice(-6)}`;

  const created = await prisma.organizer.create({
    data: {
      name: orgName,
      slug,
      verified: false,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  return {
    id: created.id,
    name: created.name,
    verified: created.verified,
  };
}

/**
 * Verifies that the signed-in user is either an ADMIN or a member (`OWNER`/`STAFF`)
 * of the `Organizer` that owns `eventId` (fixes S-05 and F-09).
 */
export async function requireOrganizerForEvent(eventId: string): Promise<{
  user: AuthenticatedUser;
  event: {
    id: string;
    title: string;
    organizerId: string;
    endTime: DateTimeOrNull;
  };
}> {
  const user = await requireUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      organizerId: true,
      endTime: true,
    },
  });

  if (!event) {
    throw new AuthzError("Event not found.", 404);
  }

  if (user.role === "ADMIN") {
    return { user, event };
  }

  const membership = await prisma.organizerMember.findUnique({
    where: {
      userId_organizerId: {
        userId: user.id,
        organizerId: event.organizerId,
      },
    },
  });

  if (!membership) {
    throw new AuthzError(
      "Forbidden: you are not an authorized organizer for this event.",
      403
    );
  }

  return { user, event };
}

type DateTimeOrNull = Date | null;

