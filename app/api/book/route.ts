import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slotId = body?.slotId as string | undefined;
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim();

  if (!slotId || !name || !email) {
    return NextResponse.json(
      { error: "Name, email, and slot are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Only succeeds if the slot is still unbooked (name is null).
  // This is the guard against two people booking the same slot at once.
  const { data, error } = await supabase
    .from("chiro_slots")
    .update({ name, email, booked_at: new Date().toISOString() })
    .eq("id", slotId)
    .is("name", null)
    .select("id, start_time, end_time")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "That time was just taken by someone else. Please pick another slot." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    slot: { id: data.id, start_time: data.start_time, end_time: data.end_time, name },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
