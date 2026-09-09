import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slotId = body?.slotId as string | undefined;
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim();

  if (!slotId || !name || !email) {
    return NextResponse.json(
      { error: "Enter the same name and email you used to book." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();

  const { data: existing, error: fetchError } = await supabase
    .from("chiro_slots")
    .select("id, name, email")
    .eq("id", slotId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Slot not found." }, { status: 404 });
  }

  const namesMatch = existing.name?.trim().toLowerCase() === name.toLowerCase();
  const emailsMatch = existing.email?.trim().toLowerCase() === email.toLowerCase();

  if (!namesMatch || !emailsMatch) {
    return NextResponse.json(
      { error: "That name and email don't match this booking. Ask an admin for help if you're stuck." },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from("chiro_slots")
    .update({ name: null, email: null, booked_at: null })
    .eq("id", slotId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ released: true });
}
