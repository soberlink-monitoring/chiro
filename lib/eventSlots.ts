import { timeToMinutes, minutesToTime, parseTimeInput } from "./format";

export type GeneratedSlot = {
  start_time: string;
  end_time: string;
  sort_order: number;
  is_break: boolean;
};

export function generateSlots(opts: {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  slotMinutes: number;
  breakStartTimes: string[]; // raw strings, parsed with parseTimeInput
}): { slots: GeneratedSlot[]; error?: string } {
  const { startTime, endTime, slotMinutes } = opts;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (!(slotMinutes > 0)) {
    return { slots: [], error: "Slot length must be a positive number of minutes." };
  }
  if (endMin <= startMin) {
    return { slots: [], error: "End time must be after start time." };
  }

  // Parse break times, ignore blanks, bail out with a clear error on anything unparseable.
  const breakSet = new Set<string>();
  for (const raw of opts.breakStartTimes) {
    if (!raw.trim()) continue;
    const parsed = parseTimeInput(raw);
    if (!parsed) {
      return { slots: [], error: `Couldn't understand the break time "${raw}". Try something like 10:40 or 10:40 AM.` };
    }
    breakSet.add(parsed);
  }

  const slots: GeneratedSlot[] = [];
  let order = 1;
  for (let t = startMin; t + slotMinutes <= endMin; t += slotMinutes) {
    const slotStart = minutesToTime(t);
    const slotEnd = minutesToTime(t + slotMinutes);
    slots.push({
      start_time: slotStart,
      end_time: slotEnd,
      sort_order: order,
      is_break: breakSet.has(slotStart),
    });
    order += 1;
  }

  if (slots.length === 0) {
    return { slots: [], error: "That time window doesn't fit even one slot. Check the start, end, and slot length." };
  }

  return { slots };
}

// Suggests a break at :50 past each hour that falls inside the window,
// as long as a full slot fits there. Purely a convenience default, the
// admin can edit or clear it before creating the event.
export function suggestBreakTimes(startTime: string, endTime: string, slotMinutes: number): string[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin || !(slotMinutes > 0)) return [];

  const breaks: string[] = [];
  let hour = Math.floor(startMin / 60);
  while (hour * 60 <= endMin) {
    const breakStart = hour * 60 + 50;
    if (breakStart >= startMin && breakStart + slotMinutes <= endMin) {
      breaks.push(minutesToTime(breakStart));
    }
    hour += 1;
  }
  return breaks;
}
