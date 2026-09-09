"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatTimeRange, formatDateLabel } from "@/lib/format";
import type { EventRow, SlotRow } from "@/lib/types";

export default function ManageEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/slots`, { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setEvent(data.event ?? null);
    setSlots(data.slots ?? []);
    setAuthed(true);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function release(slotId: string) {
    await fetch("/api/admin/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    load();
  }

  if (authed === null) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
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
    return (
      <div className="page">
        <p>Event not found.</p>
        <a className="link-btn" href="/admin">
          Back to events
        </a>
      </div>
    );
  }

  const bookableSlots = slots.filter((s) => !s.is_break);
  const bookedCount = bookableSlots.filter((s) => s.name).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{event.title}</h1>
          <p className="page-subtitle">
            {formatDateLabel(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
          </p>
          <p className="page-subtitle">
            {bookedCount} of {bookableSlots.length} slots booked
          </p>
        </div>
        <div className="top-actions">
          <a className="admin-link-btn" href="/">
            Return to home
          </a>
          <a className="admin-link-btn" href="/admin">
            All events
          </a>
        </div>
      </div>
      <div className="accent-bar" />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Name</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bookableSlots.map((slot) => (
            <tr key={slot.id} className={slot.name ? "" : "is-open"}>
              <td>{formatTimeRange(slot.start_time, slot.end_time)}</td>
              <td>{slot.name ?? "—"}</td>
              <td>{slot.email ?? "—"}</td>
              <td>
                {slot.name ? (
                  <button className="pill-release" onClick={() => release(slot.id)}>
                    Release
                  </button>
                ) : (
                  <span className="pill-open">Open</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="toolbar">
        <a className="admin-link-btn" href={`/print/${event.id}`} target="_blank" rel="noreferrer">
          Print / Export PDF
        </a>
        <a className="link-btn" href="/admin">
          Back to all events
        </a>
      </div>
    </div>
  );
}
