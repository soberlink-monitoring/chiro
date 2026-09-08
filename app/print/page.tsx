"use client";

import { useEffect, useState } from "react";
import { EVENT, BREAKS, formatTimeRange } from "@/lib/eventConfig";

type AdminSlot = {
  id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  name: string | null;
  email: string | null;
};

type Row =
  | { kind: "slot"; sort_order: number; start_time: string; end_time: string; name: string | null; email: string | null }
  | { kind: "break"; sort_order: number; start_time: string; end_time: string };

export default function PrintPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/slots", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      const slots: AdminSlot[] = data.slots ?? [];

      const slotRows: Row[] = slots.map((s) => ({
        kind: "slot",
        sort_order: s.sort_order,
        start_time: s.start_time,
        end_time: s.end_time,
        name: s.name,
        email: s.email,
      }));
      const breakRows: Row[] = BREAKS.map((b) => ({
        kind: "break",
        sort_order: b.sort_order,
        start_time: `${b.start_time}:00`,
        end_time: `${b.end_time}:00`,
      }));

      const merged = [...slotRows, ...breakRows].sort((a, b) => a.sort_order - b.sort_order);
      setRows(merged);
      setAuthed(true);

      setTimeout(() => window.print(), 400);
    })();
  }, []);

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

  const bookedCount = rows.filter((r) => r.kind === "slot" && r.name).length;

  return (
    <div className="page">
      <button className="admin-link-btn no-print" onClick={() => window.print()} style={{ marginBottom: 16 }}>
        Print / Export PDF
      </button>

      <div className="print-header">
        <h1>{EVENT.title}</h1>
        <span>{EVENT.dateLabel}</span>
      </div>
      <p style={{ fontSize: 13, color: "#3b73b9", marginTop: -8, marginBottom: 16 }}>
        {EVENT.windowLabel} · {bookedCount} appointments booked
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
          {rows.map((row, i) =>
            row.kind === "break" ? (
              <tr key={`break-${row.sort_order}`} className="break-row">
                <td>{i + 1}</td>
                <td>{formatTimeRange(row.start_time, row.end_time)}</td>
                <td colSpan={2}>BREAK</td>
              </tr>
            ) : (
              <tr key={`slot-${row.sort_order}`}>
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
