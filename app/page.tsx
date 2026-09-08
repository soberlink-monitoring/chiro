"use client";

import { useEffect, useState, useCallback } from "react";
import { EVENT, formatTimeRange } from "@/lib/eventConfig";
import { buildIcs, buildOutlookWebLink } from "@/lib/ics";
import type { PublicSlot } from "@/lib/types";

type ModalState =
  | { mode: "closed" }
  | { mode: "book"; slot: PublicSlot }
  | { mode: "release"; slot: PublicSlot }
  | { mode: "booked"; slot: PublicSlot; name: string };

export default function HomePage() {
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const loadSlots = useCallback(async () => {
    const res = await fetch("/api/slots", { cache: "no-store" });
    const data = await res.json();
    setSlots(data.slots ?? []);
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function closeModal() {
    setModal({ mode: "closed" });
  }

  function onCardClick(slot: PublicSlot) {
    setModal(slot.taken ? { mode: "release", slot } : { mode: "book", slot });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chiropractor Sign Up</h1>
          <p className="page-subtitle">
            <strong>{EVENT.title}</strong>
          </p>
          <p className="page-subtitle">
            {EVENT.dateLabel} · {EVENT.windowLabel}
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

      {slots === null && <p>Loading available times...</p>}

      {slots !== null && (
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.id}
              className={`slot-card${slot.taken ? " taken" : ""}`}
              onClick={() => onCardClick(slot)}
            >
              <div className="slot-time">{formatTimeRange(slot.start_time, slot.end_time)}</div>
              <div className="slot-status">{slot.taken ? "Booked" : "Available"}</div>
            </button>
          ))}
        </div>
      )}

      {modal.mode === "book" && (
        <BookModal slot={modal.slot} onClose={closeModal} onBooked={(name) => setModal({ mode: "booked", slot: modal.slot, name })} onRefresh={loadSlots} />
      )}

      {modal.mode === "release" && (
        <ReleaseModal slot={modal.slot} onClose={closeModal} onReleased={loadSlots} />
      )}

      {modal.mode === "booked" && (
        <BookedModal
          slot={modal.slot}
          name={modal.name}
          onClose={() => {
            closeModal();
            loadSlots();
          }}
        />
      )}
    </div>
  );
}

function BookModal({
  slot,
  onClose,
  onBooked,
  onRefresh,
}: {
  slot: PublicSlot;
  onClose: () => void;
  onBooked: (name: string) => void;
  onRefresh: () => void;
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
      onRefresh();
      return;
    }
    onBooked(name.trim());
  }

  return (
    <Overlay onClose={onClose}>
      <p className="modal-eyebrow">Book this time</p>
      <h3 className="modal-title">{formatTimeRange(slot.start_time, slot.end_time)}</h3>
      <p className="modal-subtitle">{EVENT.dateLabel}</p>

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
  slot,
  name,
  onClose,
}: {
  slot: PublicSlot;
  name: string;
  onClose: () => void;
}) {
  function downloadIcs() {
    const ics = buildIcs({ startTime: slot.start_time.slice(0, 5), endTime: slot.end_time.slice(0, 5), name });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chiropractor-appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  const outlookWebLink = buildOutlookWebLink({
    startTime: slot.start_time.slice(0, 5),
    endTime: slot.end_time.slice(0, 5),
    name,
  });

  return (
    <Overlay onClose={onClose}>
      <div className="success-box">
        <h3>You're booked</h3>
        <p>
          {formatTimeRange(slot.start_time, slot.end_time)} on {EVENT.dateLabel}
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
