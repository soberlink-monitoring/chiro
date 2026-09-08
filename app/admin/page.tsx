"use client";

import { useEffect, useState, useCallback } from "react";
import { EVENT, formatTimeRange } from "@/lib/eventConfig";

type AdminSlot = {
  id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  name: string | null;
  email: string | null;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/slots", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setSlots(data.slots ?? []);
    setAuthed(true);
  }, []);

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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
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

  const bookedCount = slots.filter((s) => s.name).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p className="page-subtitle">
            <strong>{EVENT.title}</strong>
          </p>
          <p className="page-subtitle">
            {EVENT.dateLabel} · {bookedCount} of {slots.length} slots booked
          </p>
        </div>
        <button className="admin-link-btn" onClick={logout}>
          Log out
        </button>
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
          {slots.map((slot) => (
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
        <a className="admin-link-btn" href="/print" target="_blank" rel="noreferrer">
          Print / Export PDF
        </a>
        <a className="link-btn" href="/">
          Back to sign up page
        </a>
      </div>
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
    <div className="admin-login-wrap">
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
  );
}
