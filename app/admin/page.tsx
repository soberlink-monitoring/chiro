"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTimeRange, formatDateLabel } from "@/lib/format";
import type { EventWithCounts } from "@/lib/types";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [events, setEvents] = useState<EventWithCounts[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setAuthed(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function removeEvent(id: string, label: string) {
    if (!confirm(`Delete "${label}"? This removes all its bookings too. This can't be undone.`)) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
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
    return <AdminLogin onSuccess={load} />;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p className="page-subtitle">Manage sign-up days and bookings.</p>
        </div>
        <div className="top-actions">
          <a className="admin-link-btn" href="/">
            Return to home
          </a>
          <button className="admin-link-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      <div className="accent-bar" />

      <div className="toolbar" style={{ marginTop: 0, marginBottom: 20 }}>
        <p className="page-subtitle" style={{ margin: 0 }}>
          {events.length} event{events.length === 1 ? "" : "s"}
        </p>
        <a className="admin-link-btn" href="/admin/new">
          + New Event
        </a>
      </div>

      {events.length === 0 && <div className="empty-state">No events yet. Create your first one.</div>}

      {events.map((ev) => (
        <div className="event-card" key={ev.id}>
          <div>
            <div className="event-card-title">{ev.title}</div>
            <div className="event-card-meta">
              {formatDateLabel(ev.event_date)} · {formatTimeRange(ev.start_time, ev.end_time)}
            </div>
          </div>
          <div className="event-card-actions" style={{ alignItems: "center" }}>
            <span className="event-card-badge">
              {ev.booked_slots} of {ev.total_slots} booked
            </span>
            {ev.event_date >= today && <span className="event-card-badge">Live on home page</span>}
            <a className="admin-link-btn" href={`/admin/events/${ev.id}`}>
              Manage
            </a>
            <a className="admin-link-btn" href={`/print/${ev.id}`} target="_blank" rel="noreferrer">
              Print
            </a>
            <button className="pill-danger-outline" onClick={() => removeEvent(ev.id, ev.title)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Incorrect password.");
      return;
    }
    onSuccess();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div />
        <a className="admin-link-btn no-print" href="/">
          Return to home
        </a>
      </div>
      <div className="admin-login-wrap" style={{ margin: "60px auto" }}>
        <h1 style={{ color: "#17417c", fontSize: 22 }}>Admin Login</h1>
        <p className="page-subtitle" style={{ marginBottom: 20 }}>
          Enter the admin password to manage bookings.
        </p>
        <input
          className="field-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" onClick={submit} disabled={submitting}>
          {submitting ? "Checking..." : "Log In"}
        </button>
      </div>
    </div>
  );
}
