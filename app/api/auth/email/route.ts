import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, university, city, mode, phone } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const name = (fullName || cleanEmail.split("@")[0]).trim();

    let user: any = null;

    if (mode === "login") {
      // Find existing user or create on-the-fly
      user = await (prisma as any).user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        // Auto-provision if logging in for first time
        user = await (prisma as any).user.create({
          data: {
            email: cleanEmail,
            fullName: name,
            city: city || "Karachi",
            university: university || "",
            rollNumber: phone || "",
          },
        });
      }
    } else {
      // Register mode: Upsert user record in Neon PostgreSQL
      user = await (prisma as any).user.upsert({
        where: { email: cleanEmail },
        update: {
          fullName: name,
          city: city || undefined,
          university: university || undefined,
          rollNumber: phone || undefined,
        },
        create: {
          email: cleanEmail,
          fullName: name,
          city: city || "Karachi",
          university: university || "",
          rollNumber: phone || "",
        },
      });
    }

    const sessionPayload = {
      id: user.id,
      name: user.fullName || cleanEmail.split("@")[0],
      email: user.email,
      city: user.city || "Karachi",
      university: user.university || "",
      image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName || cleanEmail)}`,
    };

    const res = NextResponse.json({ success: true, user: sessionPayload });

    // Set secure authentication cookie
    res.cookies.set("eventer_auth", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    return res;
  } catch (err: any) {
    console.error("Auth email API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process authentication request." },
      { status: 500 }
    );
  }
}
