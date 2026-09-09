export function formatTimeRange(start: string, end: string) {
  return `${to12Hour(start)} – ${to12Hour(end)}`;
}

export function to12Hour(t: string) {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

export function formatDateLabel(isoDate: string) {
  // isoDate like "2026-09-21". Build the date from parts so it's not
  // shifted by the browser's local timezone.
  const [y, m, d] = isoDate.split("-").map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Accepts "10:40", "10:40 AM", "10:40am", "2:20 PM", "2:20pm" and
// returns 24-hour "HH:MM", or null if it can't be parsed.
export function parseTimeInput(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = match[3];

  if (minute < 0 || minute > 59) return null;

  if (suffix === "am") {
    if (hour === 12) hour = 0;
    if (hour < 1 || hour > 12) return null;
  } else if (suffix === "pm") {
    if (hour < 1 || hour > 12) return null;
    if (hour !== 12) hour += 12;
  } else {
    // No am/pm given: assume 24-hour input.
    if (hour < 0 || hour > 23) return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

export function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
