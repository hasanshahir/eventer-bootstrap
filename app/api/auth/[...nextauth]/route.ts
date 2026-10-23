import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.redirect("/login");
}

export async function POST() {
  return NextResponse.redirect("/login");
}
