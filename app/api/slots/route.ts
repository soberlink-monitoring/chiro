import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { EVENT } from "@/lib/eventConfig";
import type { SlotRow, PublicSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("chiro_slots")
    .select("id, start_time, end_time, sort_order, name, email")
    .eq("event_date", EVENT.isoDate)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots: PublicSlot[] = (data as SlotRow[]).map((row) => ({
    id: row.id,
    start_time: row.start_time,
    end_time: row.end_time,
    sort_order: row.sort_order,
    taken: Boolean(row.name && row.email),
  }));

  return NextResponse.json({ slots });
}
