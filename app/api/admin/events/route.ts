import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isAdminRequest } from "@/lib/adminAuth";
import { generateSlots } from "@/lib/eventSlots";
import { parseTimeInput } from "@/lib/format";
import type { EventRow, SlotRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  const { data: events, error } = await supabase
    .from("chiro_events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: slots, error: slotsError } = await supabase
    .from("chiro_slots")
    .select("event_id, is_break, name, email");

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  const counts = new Map<string, { total: number; booked: number }>();
  for (const s of slots as Pick<SlotRow, "event_id" | "is_break" | "name" | "email">[]) {
    if (s.is_break) continue;
    const c = counts.get(s.event_id) ?? { total: 0, booked: 0 };
    c.total += 1;
    if (s.name?.trim() && s.email?.trim()) c.booked += 1;
    counts.set(s.event_id, c);
  }

  const withCounts = (events as EventRow[]).map((e) => ({
    ...e,
    total_slots: counts.get(e.id)?.total ?? 0,
    booked_slots: counts.get(e.id)?.booked ?? 0,
  }));

  return NextResponse.json({ events: withCounts });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = ((body?.title as string | undefined) || "Chiropractor Visit with Dr. John").trim();
  const eventDate = body?.eventDate as string | undefined; // "2026-10-19"
  const location = ((body?.location as string | undefined) || "Soberlink Office").trim();
  const slotMinutes = Number(body?.slotMinutes ?? 10);
  const rawStart = body?.startTime as string | undefined;
  const rawEnd = body?.endTime as string | undefined;
  const rawBreaks = (body?.breakTimes as string | undefined) ?? "";

  if (!eventDate || !rawStart || !rawEnd) {
    return NextResponse.json({ error: "Date, start time, and end time are required." }, { status: 400 });
  }

  const startTime = parseTimeInput(rawStart);
  const endTime = parseTimeInput(rawEnd);
  if (!startTime || !endTime) {
    return NextResponse.json({ error: "Couldn't understand the start or end time." }, { status: 400 });
  }

  const breakStartTimes = rawBreaks
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const { slots, error: genError } = generateSlots({
    startTime,
    endTime,
    slotMinutes,
    breakStartTimes,
  });

  if (genError) {
    return NextResponse.json({ error: genError }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: event, error: insertEventError } = await supabase
    .from("chiro_events")
    .insert({
      title,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      slot_minutes: slotMinutes,
      location,
    })
    .select("*")
    .single();

  if (insertEventError || !event) {
    return NextResponse.json({ error: insertEventError?.message ?? "Could not create event." }, { status: 500 });
  }

  const slotRows = slots.map((s) => ({
    event_id: event.id,
    start_time: s.start_time,
    end_time: s.end_time,
    sort_order: s.sort_order,
    is_break: s.is_break,
  }));

  const { error: insertSlotsError } = await supabase.from("chiro_slots").insert(slotRows);

  if (insertSlotsError) {
    // Roll back the event so we don't leave an event with no slots.
    await supabase.from("chiro_events").delete().eq("id", event.id);
    return NextResponse.json({ error: insertSlotsError.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}
