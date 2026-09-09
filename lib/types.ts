export type EventRow = {
  id: string;
  title: string;
  event_date: string; // "2026-09-21"
  start_time: string; // "10:00:00"
  end_time: string; // "13:00:00"
  slot_minutes: number;
  location: string;
  created_at: string;
};

export type SlotRow = {
  id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  is_break: boolean;
  name: string | null;
  email: string | null;
  booked_at: string | null;
};

export type PublicSlot = {
  id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  taken: boolean;
};

export type EventWithCounts = EventRow & {
  total_slots: number;
  booked_slots: number;
};
