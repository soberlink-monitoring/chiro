-- Run this once in the Supabase SQL editor for your project.
-- It creates the table and seeds the bookable time slots for
-- Dr. John's chiropractor visit on Monday, September 21, 2026.
--
-- Slots run 10:00 AM to 1:00 PM in 10-minute increments.
-- A 10-minute break is built into the schedule once per hour
-- (10:40, 11:30, 12:20). Breaks are intentionally NOT rows in this
-- table, so they never appear as bookable and never show up on the
-- public sign-up page. They are re-inserted only when the admin
-- prints/exports the PDF, so the printed schedule reads correctly.

create extension if not exists "pgcrypto";

create table if not exists chiro_slots (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  sort_order int not null unique,
  name text,
  email text,
  booked_at timestamptz
);

-- Seed the 15 bookable slots for Sept 21, 2026.
-- Safe to re-run: it skips rows that already exist for this date.
insert into chiro_slots (event_date, start_time, end_time, sort_order)
select '2026-09-21', s.start_time, s.end_time, s.sort_order
from (values
  ('10:00', '10:10', 1),
  ('10:10', '10:20', 2),
  ('10:20', '10:30', 3),
  ('10:30', '10:40', 4),
  ('10:50', '11:00', 5),
  ('11:00', '11:10', 6),
  ('11:10', '11:20', 7),
  ('11:20', '11:30', 8),
  ('11:40', '11:50', 9),
  ('11:50', '12:00', 10),
  ('12:00', '12:10', 11),
  ('12:10', '12:20', 12),
  ('12:30', '12:40', 13),
  ('12:40', '12:50', 14),
  ('12:50', '13:00', 15)
) as s(start_time, end_time, sort_order)
where not exists (
  select 1 from chiro_slots where sort_order = s.sort_order and event_date = '2026-09-21'
);

-- Row Level Security: lock the table down. All reads/writes for this
-- app go through the Next.js API routes using the service role key,
-- which bypasses RLS, so the browser never talks to Supabase directly.
alter table chiro_slots enable row level security;
