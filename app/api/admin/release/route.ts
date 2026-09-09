import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isAdminRequest } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const slotId = body?.slotId as string | undefined;
  if (!slotId) {
    return NextResponse.json({ error: "Missing slotId." }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("chiro_slots")
    .update({ name: null, email: null, booked_at: null })
    .eq("id", slotId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ released: true });
}
