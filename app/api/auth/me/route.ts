import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("eventer_auth")?.value;
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = JSON.parse(cookie);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
