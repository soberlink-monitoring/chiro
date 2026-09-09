"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatTimeRange, formatDateLabel } from "@/lib/format";
import type { EventRow, SlotRow } from "@/lib/types";

export default function PrintEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/events/${eventId}/slots`, { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setEvent(data.event ?? null);
      setSlots((data.slots ?? []).slice().sort((a: SlotRow, b: SlotRow) => a.sort_order - b.sort_order));
      setAuthed(true);
      setTimeout(() => window.print(), 500);
    })();
  }, [eventId]);

  if (authed === null) {
    return <div className="page">Loading...</div>;
  }

  if (!authed) {
    return (
      <div className="page">
        <p>You need to be logged in as admin to view this page.</p>
        <a className="link-btn" href="/admin">
          Go to admin login
        </a>
      </div>
    );
  }

  if (!event) {
    return <div className="page">Event not found.</div>;
  }

  const bookedCount = slots.filter((s) => !s.is_break && s.name).length;
  const bookableCount = slots.filter((s) => !s.is_break).length;

  return (
    <div className="page">
      <button className="admin-link-btn no-print" onClick={() => window.print()} style={{ marginBottom: 16 }}>
        Print / Export PDF
      </button>

      <div className="print-header">
        <h1>{event.title}</h1>
        <span>{formatDateLabel(event.event_date)}</span>
      </div>
      <p style={{ fontSize: 13, color: "#3b73b9", marginTop: -8, marginBottom: 16 }}>
        {formatTimeRange(event.start_time, event.end_time)} · {bookedCount} of {bookableCount} appointments booked
      </p>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th style={{ width: 150 }}>Time</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((row, i) =>
            row.is_break ? (
              <tr key={row.id} className="break-row">
                <td>{i + 1}</td>
                <td>{formatTimeRange(row.start_time, row.end_time)}</td>
                <td colSpan={2}>BREAK</td>
              </tr>
            ) : (
              <tr key={row.id}>
                <td>{i + 1}</td>
                <td>{formatTimeRange(row.start_time, row.end_time)}</td>
                <td>{row.name ?? ""}</td>
                <td>{row.email ?? ""}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
