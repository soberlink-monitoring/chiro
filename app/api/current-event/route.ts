import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { EventRow, SlotRow, PublicSlot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseServer();
  const today = new Date().toISOString().slice(0, 10);

  // Prefer the nearest upcoming (or today's) event.
  let { data: event, error: eventError } = await supabase
    .from("chiro_events")
    .select("*")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // Nothing upcoming: fall back to the most recent past event so the
  // page isn't just blank if someone visits between events.
  if (!event) {
    const { data: pastEvent, error: pastError } = await supabase
      .from("chiro_events")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pastError) {
      return NextResponse.json({ error: pastError.message }, { status: 500 });
    }
    event = pastEvent;
  }

  if (!event) {
    return NextResponse.json({ event: null, slots: [] });
  }

  const { data: slotRows, error: slotsError } = await supabase
    .from("chiro_slots")
    .select("id, start_time, end_time, sort_order, is_break, name, email")
    .eq("event_id", (event as EventRow).id)
    .eq("is_break", false)
    .order("sort_order", { ascending: true });

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  const slots: PublicSlot[] = (slotRows as SlotRow[]).map((row) => ({
    id: row.id,
    start_time: row.start_time,
    end_time: row.end_time,
    sort_order: row.sort_order,
    taken: Boolean(row.name?.trim() && row.email?.trim()),
  }));

  const res = NextResponse.json({ event, slots });
  res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return res;
}
