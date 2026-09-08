// Central place to change the event date/time/title.
// If you ever reuse this app for another chiro day, this is the
// only file (plus the seed insert in supabase/schema.sql) you need to edit.

export const EVENT = {
  title: "Chiropractor Visit with Dr. John",
  dateLabel: "Monday, September 21, 2026",
  isoDate: "2026-09-21",
  timeZone: "America/Los_Angeles",
  windowLabel: "10:00 am – 1:00 pm",
  location: "Soberlink Office",
};

// Breaks are never bookable and never shown on the public page.
// They exist only so the printed/exported PDF shows a complete,
// correctly ordered schedule (matching how the original sheet looked).
export const BREAKS: { start_time: string; end_time: string; sort_order: number }[] = [
  { start_time: "10:40", end_time: "10:50", sort_order: 4.5 },
  { start_time: "11:30", end_time: "11:40", sort_order: 8.5 },
  { start_time: "12:20", end_time: "12:30", sort_order: 12.5 },
];

export function formatTimeRange(start: string, end: string) {
  return `${to12Hour(start)} – ${to12Hour(end)}`;
}

function to12Hour(t: string) {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}
