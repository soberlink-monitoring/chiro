export type SlotRow = {
  id: string;
  event_date: string;
  start_time: string; // "10:00:00"
  end_time: string; // "10:10:00"
  sort_order: number;
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
