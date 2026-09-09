import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
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

  const { data: slots, error: slotsError } = await supabase
    .from("chiro_slots")
    .select("id, start_time, end_time, sort_order, is_break, name, email, booked_at")
    .eq("event_id", params.id)
    .order("sort_order", { ascending: true });

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  const res = NextResponse.json({ event, slots });
  res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return res;
}
