"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatTimeRange, formatDateLabel, parseTimeInput, to12HourUpper } from "@/lib/format";
import { suggestBreakTimes } from "@/lib/eventSlots";
import type { EventRow, SlotRow } from "@/lib/types";

export default function ManageEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [showExtend, setShowExtend] = useState(false);

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
        <button className="admin-link-btn" onClick={() => setShowExtend((v) => !v)}>
          {showExtend ? "Close" : "+ Add More Time"}
        </button>
        <a className="link-btn" href="/admin">
          Back to all events
        </a>
      </div>

      {showExtend && (
        <ExtendPanel
          event={event}
          onAdded={() => {
            setShowExtend(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ExtendPanel({ event, onAdded }: { event: EventRow; onAdded: () => void }) {
  const currentEnd = event.end_time.slice(0, 5);
  const [newEndTime, setNewEndTime] = useState(to12HourUpper(currentEnd));
  const [breakTimes, setBreakTimes] = useState("");
  const [breaksTouched, setBreaksTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (breaksTouched) return;
    const parsedEnd = parseTimeInput(newEndTime);
    if (!parsedEnd) return;
    const suggested = suggestBreakTimes(currentEnd, parsedEnd, event.slot_minutes);
    setBreakTimes(suggested.map(to12HourUpper).join(", "));
  }, [newEndTime, breaksTouched, currentEnd, event.slot_minutes]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/admin/events/${event.id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEndTime, breakTimes }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    onAdded();
  }

  return (
    <div className="event-card" style={{ display: "block", marginTop: 16 }}>
      <p className="modal-eyebrow" style={{ marginBottom: 10 }}>
        Add more time
      </p>
      <p className="page-subtitle" style={{ marginBottom: 16 }}>
        Adds new slots after the current end time ({to12HourUpper(currentEnd)}). Existing bookings are untouched.
      </p>

      <div className="form-grid">
        <label className="field-label">New end time</label>
        <input
          className="field-input"
          value={newEndTime}
          onChange={(e) => setNewEndTime(e.target.value)}
          placeholder="2:00 PM"
        />

        <label className="field-label">Break start times</label>
        <input
          className="field-input"
          value={breakTimes}
          onChange={(e) => {
            setBreakTimes(e.target.value);
            setBreaksTouched(true);
          }}
          placeholder="1:50 PM"
        />
        <p className="field-hint">Auto-suggested at :50 past each added hour, edit or clear as needed.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" style={{ maxWidth: 220 }} onClick={submit} disabled={submitting}>
        {submitting ? "Adding..." : "Add These Slots"}
      </button>
    </div>
  );
}
