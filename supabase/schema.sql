-- This replaces the earlier single-event schema with a multi-event one.
-- Running this DROPS and recreates chiro_slots, so any existing rows
-- (including your Sept 21 test bookings) will be cleared. If you have
-- real bookings you need to keep, stop and ask Claude for a
-- data-preserving migration instead of running this file as-is.

create extension if not exists "pgcrypto";

drop table if exists chiro_slots;
drop table if exists chiro_events;

-- One row per sign-up day (e.g. "Chiropractor Visit with Dr. John, Sept 21").
create table chiro_events (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Chiropractor Visit with Dr. John',
  event_date date not null,
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 10,
  location text not null default 'Soberlink Office',
  created_at timestamptz not null default now()
);

-- One row per time slot for a given event. Breaks ARE rows here
-- (is_break = true), so the printed schedule always reads correctly,
-- but the public page filters them out and they're never bookable.
create table chiro_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references chiro_events(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  sort_order int not null,
  is_break boolean not null default false,
  name text,
  email text,
  booked_at timestamptz,
  unique (event_id, sort_order)
);

alter table chiro_events enable row level security;
alter table chiro_slots enable row level security;

-- Seed your existing Sept 21 day into the new structure so you don't
-- lose the event you already set up. Breaks are included as rows.
with new_event as (
  insert into chiro_events (title, event_date, start_time, end_time, slot_minutes, location)
  values ('Chiropractor Visit with Dr. John', '2026-09-21', '10:00', '13:00', 10, 'Soberlink Office')
  returning id
)
insert into chiro_slots (event_id, start_time, end_time, sort_order, is_break)
select new_event.id, s.start_time::time, s.end_time::time, s.sort_order, s.is_break
from new_event, (values
  ('10:00', '10:10', 1, false),
  ('10:10', '10:20', 2, false),
  ('10:20', '10:30', 3, false),
  ('10:30', '10:40', 4, false),
  ('10:40', '10:50', 5, true),
  ('10:50', '11:00', 6, false),
  ('11:00', '11:10', 7, false),
  ('11:10', '11:20', 8, false),
  ('11:20', '11:30', 9, false),
  ('11:30', '11:40', 10, true),
  ('11:40', '11:50', 11, false),
  ('11:50', '12:00', 12, false),
  ('12:00', '12:10', 13, false),
  ('12:10', '12:20', 14, false),
  ('12:20', '12:30', 15, true),
  ('12:30', '12:40', 16, false),
  ('12:40', '12:50', 17, false),
  ('12:50', '13:00', 18, false)
) as s(start_time, end_time, sort_order, is_break);
