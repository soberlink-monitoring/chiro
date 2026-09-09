import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isAdminRequest } from "@/lib/adminAuth";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  // chiro_slots has `on delete cascade` on event_id, so this also removes its slots.
  const { error } = await supabase.from("chiro_events").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
