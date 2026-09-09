import { NextResponse } from "next/server";
import { buildClearAdminCookie } from "@/lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildClearAdminCookie());
  return res;
}
