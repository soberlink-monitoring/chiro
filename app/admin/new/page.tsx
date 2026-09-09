"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseTimeInput, to12HourUpper } from "@/lib/format";
import { suggestBreakTimes } from "@/lib/eventSlots";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Chiropractor Visit with Dr. John");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("1:00 PM");
  const [slotMinutes, setSlotMinutes] = useState("10");
  const [location, setLocation] = useState("Soberlink Office");
  const [breakTimes, setBreakTimes] = useState("10:50 AM, 11:50 AM, 12:50 PM");
  const [breaksTouched, setBreaksTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Recompute the suggested break times whenever the window changes,
  // as long as the admin hasn't typed their own breaks in already.
  useEffect(() => {
    if (breaksTouched) return;
    const start = parseTimeInput(startTime);
    const end = parseTimeInput(endTime);
    const minutes = Number(slotMinutes);
    if (!start || !end || !(minutes > 0)) return;

    const suggested = suggestBreakTimes(start, end, minutes);
    setBreakTimes(suggested.map(to12HourUpper).join(", "));
  }, [startTime, endTime, slotMinutes, breaksTouched]);

  async function submit() {
    setError(null);
    if (!eventDate) {
      setError("Please pick a date.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        eventDate,
        startTime,
        endTime,
        slotMinutes: Number(slotMinutes),
        location,
        breakTimes,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push(`/admin/events/${data.event.id}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>New Event</h1>
          <p className="page-subtitle">This becomes the live sign-up page automatically once its date arrives.</p>
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

      <div className="form-grid">
        <label className="field-label">Title</label>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="field-label">Date</label>
        <input
          className="field-input"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <label className="field-label field-half">Start time</label>
        <label className="field-label field-half">End time</label>
        <input
          className="field-input field-half"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="10:00 AM"
        />
        <input
          className="field-input field-half"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="1:00 PM"
        />

        <label className="field-label">Slot length (minutes)</label>
        <input
          className="field-input"
          type="number"
          min="5"
          step="5"
          value={slotMinutes}
          onChange={(e) => setSlotMinutes(e.target.value)}
        />

        <label className="field-label">Location</label>
        <input className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} />

        <label className="field-label">Break start times</label>
        <input
          className="field-input"
          value={breakTimes}
          onChange={(e) => {
            setBreakTimes(e.target.value);
            setBreaksTouched(true);
          }}
          placeholder="10:50 AM, 11:50 AM, 12:50 PM"
        />
        <p className="field-hint">
          Auto-suggested at :50 past each hour in your window, edit or clear as needed.{" "}
          {breaksTouched && (
            <button type="button" className="link-btn" onClick={() => setBreaksTouched(false)}>
              Reset to suggested
            </button>
          )}
          {" "}Each one blocks out a slot-length break at that start time, hidden from the public page, shown as
          BREAK on the printed schedule.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" style={{ maxWidth: 240 }} onClick={submit} disabled={submitting}>
        {submitting ? "Creating..." : "Create Event"}
      </button>
    </div>
  );
}
