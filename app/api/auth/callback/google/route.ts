import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${proto}://${host}/api/auth/callback/google`;

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${proto}://${host}/login?error=${encodeURIComponent(error || "no_code")}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      console.error("Failed to exchange Google token:", tokenData);
      return NextResponse.redirect(`${proto}://${host}/login?error=token_exchange_failed`);
    }

    // Decode ID token payload (base64url)
    const base64Payload = tokenData.id_token.split(".")[1];
    const payloadStr = Buffer.from(base64Payload, "base64").toString("utf-8");
    const googleUser = JSON.parse(payloadStr);

    const email = googleUser.email;
    const name = googleUser.name || email.split("@")[0];
    const picture = googleUser.picture || "";

    // Upsert user into Neon PostgreSQL via Prisma
    let dbUser: any = null;
    try {
      dbUser = await (prisma as any).user.upsert({
        where: { email },
        update: { fullName: name },
        create: {
          email,
          fullName: name,
        },
      });
    } catch (dbErr) {
      console.error("Error saving user to Neon database:", dbErr);
    }

    const sessionPayload = {
      id: dbUser?.id || googleUser.sub,
      name,
      email,
      image: picture,
    };

    // Set cookie and redirect back to app
    const res = NextResponse.redirect(`${proto}://${host}/?auth=success`);
    res.cookies.set("eventr_auth", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: proto === "https",
    });

    return res;
  } catch (err: any) {
    console.error("OAuth callback exception:", err);
    return NextResponse.redirect(`${proto}://${host}/login?error=auth_failed`);
  }
}
