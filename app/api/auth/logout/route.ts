import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

  const res = NextResponse.redirect(`${proto}://${host}/`);
  res.cookies.delete("eventr_auth");
  res.cookies.delete("eventer_auth");
  return res;
}
