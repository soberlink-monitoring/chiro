"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTimeRange, formatDateLabel } from "@/lib/format";
import { buildIcs, buildOutlookWebLink } from "@/lib/ics";
import type { EventRow, PublicSlot } from "@/lib/types";

type ModalState =
  | { mode: "closed" }
  | { mode: "book"; slot: PublicSlot }
  | { mode: "release"; slot: PublicSlot }
  | { mode: "booked"; slot: PublicSlot; name: string };

export default function HomePage() {
  const [event, setEvent] = useState<EventRow | null | undefined>(undefined);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/current-event?t=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    setEvent(data.event ?? null);
    setSlots(data.slots ?? []);
  }, []);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  function closeModal() {
    setModal({ mode: "closed" });
  }

  function onCardClick(slot: PublicSlot) {
    setModal(slot.taken ? { mode: "release", slot } : { mode: "book", slot });
  }

  // Updates the one card in place instead of waiting on a full refetch,
  // so the grid changes the instant you book, or the instant the
  // server tells you a slot was already taken.
  function markSlotTaken(slotId: string, taken: boolean) {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, taken } : s)));
  }

  if (event === undefined) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Chiropractor Sign Up</h1>
          <a className="admin-link-btn no-print" href="/admin">
            Admin
          </a>
        </div>
        <div className="accent-bar" />
        <div className="empty-state">No appointment day is scheduled right now. Check back soon.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chiropractor Sign Up</h1>
          <p className="page-subtitle">
            <strong>{event.title}</strong>
          </p>
          <p className="page-subtitle">
            {formatDateLabel(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
          </p>
        </div>
        <a className="admin-link-btn no-print" href="/admin">
          Admin
        </a>
      </div>
      <div className="accent-bar" />

      <div className="legend">
        <span>
          <span className="legend-dot open" /> Open, click to book
        </span>
        <span>
          <span className="legend-dot taken" /> Booked, click to release
        </span>
      </div>

      <div className="slot-grid">
        {slots.map((slot) => (
          <button
            key={slot.id}
            className={`slot-card${slot.taken ? " taken" : ""}`}
            onClick={() => onCardClick(slot)}
          >
            <div className="slot-time">{formatTimeRange(slot.start_time, slot.end_time)}</div>
            <div className="slot-status">{slot.taken ? "Booked, click to release" : "Available"}</div>
          </button>
        ))}
      </div>

      {modal.mode === "book" && (
        <BookModal
          event={event}
          slot={modal.slot}
          onClose={closeModal}
          onBooked={(name) => {
            markSlotTaken(modal.slot.id, true);
            setModal({ mode: "booked", slot: modal.slot, name });
          }}
          onConflict={() => markSlotTaken(modal.slot.id, true)}
        />
      )}

      {modal.mode === "release" && (
        <ReleaseModal
          slot={modal.slot}
          onClose={closeModal}
          onReleased={() => markSlotTaken(modal.slot.id, false)}
        />
      )}

      {modal.mode === "booked" && (
        <BookedModal event={event} slot={modal.slot} name={modal.name} onClose={closeModal} />
      )}
    </div>
  );
}

function BookModal({
  event,
  slot,
  onClose,
  onBooked,
  onConflict,
}: {
  event: EventRow;
  slot: PublicSlot;
  onClose: () => void;
  onBooked: (name: string) => void;
  onConflict: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: slot.id, name, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      if (res.status === 409) onConflict();
      return;
    }
    onBooked(name.trim());
  }

  return (
    <Overlay onClose={onClose}>
      <p className="modal-eyebrow">Book this time</p>
      <h3 className="modal-title">{formatTimeRange(slot.start_time, slot.end_time)}</h3>
      <p className="modal-subtitle">{formatDateLabel(event.event_date)}</p>

      <label className="field-label" htmlFor="book-name">
        Name
      </label>
      <input
        id="book-name"
        className="field-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
      />

      <label className="field-label" htmlFor="book-email">
        Email
      </label>
      <input
        id="book-email"
        className="field-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@soberlink.com"
        type="email"
      />

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" onClick={submit} disabled={submitting}>
        {submitting ? "Booking..." : "Book This Time"}
      </button>

      <div className="close-row">
        <button className="link-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Overlay>
  );
}

function ReleaseModal({
  slot,
  onClose,
  onReleased,
}: {
  slot: PublicSlot;
  onClose: () => void;
  onReleased: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: slot.id, name, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    onReleased();
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <p className="modal-eyebrow">Release this time</p>
      <h3 className="modal-title">{formatTimeRange(slot.start_time, slot.end_time)}</h3>
      <p className="modal-subtitle">
        This slot is booked. Enter the same name and email you used to book it to release it.
      </p>

      <label className="field-label" htmlFor="release-name">
        Name
      </label>
      <input
        id="release-name"
        className="field-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name you booked with"
      />

      <label className="field-label" htmlFor="release-email">
        Email
      </label>
      <input
        id="release-email"
        className="field-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email you booked with"
        type="email"
      />

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-danger" onClick={submit} disabled={submitting}>
        {submitting ? "Releasing..." : "Release This Time"}
      </button>

      <div className="close-row">
        <button className="link-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Overlay>
  );
}

function BookedModal({
  event,
  slot,
  name,
  onClose,
}: {
  event: EventRow;
  slot: PublicSlot;
  name: string;
  onClose: () => void;
}) {
  function downloadIcs() {
    const ics = buildIcs({
      isoDate: event.event_date,
      startTime: slot.start_time.slice(0, 5),
      endTime: slot.end_time.slice(0, 5),
      title: event.title,
      location: event.location,
      attendeeName: name,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chiropractor-appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  const outlookWebLink = buildOutlookWebLink({
    isoDate: event.event_date,
    startTime: slot.start_time.slice(0, 5),
    endTime: slot.end_time.slice(0, 5),
    title: event.title,
    location: event.location,
    attendeeName: name,
  });

  return (
    <Overlay onClose={onClose}>
      <div className="success-box">
        <h3>You're booked</h3>
        <p>
          {formatTimeRange(slot.start_time, slot.end_time)} on {formatDateLabel(event.event_date)}
        </p>
      </div>

      <div className="calendar-btn-row">
        <a className="calendar-btn" href={outlookWebLink} target="_blank" rel="noreferrer">
          Add to Outlook Online
        </a>
        <button className="calendar-btn" onClick={downloadIcs}>
          Add to Outlook Desktop
        </button>
      </div>

      <button className="btn btn-secondary" onClick={onClose}>
        Done
      </button>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">{children}</div>
    </div>
  );
}
