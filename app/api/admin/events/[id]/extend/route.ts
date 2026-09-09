import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isAdminRequest } from "@/lib/adminAuth";
import { generateSlots } from "@/lib/eventSlots";
import { parseTimeInput, timeToMinutes } from "@/lib/format";
import type { EventRow, SlotRow } from "@/lib/types";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawNewEnd = body?.newEndTime as string | undefined;
  const rawBreaks = (body?.breakTimes as string | undefined) ?? "";

  if (!rawNewEnd) {
    return NextResponse.json({ error: "Enter a new end time." }, { status: 400 });
  }

  const newEndTime = parseTimeInput(rawNewEnd);
  if (!newEndTime) {
    return NextResponse.json({ error: "Couldn't understand that end time." }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: event, error: eventError } = await supabase
    .from("chiro_events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const currentEndTime = (event as EventRow).end_time.slice(0, 5);

  if (timeToMinutes(newEndTime) <= timeToMinutes(currentEndTime)) {
    return NextResponse.json(
      { error: `New end time must be after the current end time (${currentEndTime}).` },
      { status: 400 }
    );
  }

  const { data: existingSlots, error: slotsError } = await supabase
    .from("chiro_slots")
    .select("sort_order")
    .eq("event_id", params.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  const maxSortOrder = (existingSlots as Pick<SlotRow, "sort_order">[])[0]?.sort_order ?? 0;

  const breakStartTimes = rawBreaks
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const { slots, error: genError } = generateSlots({
    startTime: currentEndTime,
    endTime: newEndTime,
    slotMinutes: (event as EventRow).slot_minutes,
    breakStartTimes,
  });

  if (genError) {
    return NextResponse.json({ error: genError }, { status: 400 });
  }

  const newRows = slots.map((s) => ({
    event_id: params.id,
    start_time: s.start_time,
    end_time: s.end_time,
    sort_order: maxSortOrder + s.sort_order,
    is_break: s.is_break,
  }));

  const { error: insertError } = await supabase.from("chiro_slots").insert(newRows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateEventError } = await supabase
    .from("chiro_events")
    .update({ end_time: newEndTime })
    .eq("id", params.id);

  if (updateEventError) {
    return NextResponse.json({ error: updateEventError.message }, { status: 500 });
  }

  return NextResponse.json({ added: newRows.length });
}
