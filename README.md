# Soberlink Chiropractor Sign Up

A branded sign-up page for chiropractor visits. Built with Next.js and Supabase, deployed on Vercel.

## What's new: multiple events, no code changes

You can now create a brand new sign-up day entirely from the Admin panel, no editing files, no redeploying. Whichever event has the nearest upcoming (or today's) date is automatically the one shown on the public home page. Every past event stays in Admin with its full booking list and a printable PDF, nothing gets deleted when a new one is created.

## What it does

- **Public page (`/`)**: shows the current event's time slots as rounded cards. Breaks are stored as real rows in the schedule but are always filtered out here, so they never appear as bookable.
- **Book a slot**: enter name and email, get "Add to Outlook Online" and "Add to Outlook Desktop" (.ics download) buttons. The card grays out and switches to "Booked, click to release" immediately, no page refresh needed.
- **Release a slot yourself**: click a booked card, re-enter the same name and email it was booked with.
- **Admin (`/admin`)**: password-protected. Shows every event as a card with a booked/total count. From here:
  - **+ New Event** creates a new day: title, date, start/end time, slot length, location, and optional break start times (e.g. "10:40 AM, 11:30 AM, 12:20 PM"). Slots are generated automatically.
  - **Manage** opens the full booking list for one event, with a one-click Release for any slot.
  - **Print** opens a clean, correctly ordered PDF-ready view for that event (BREAK rows included), and auto-opens the print dialog. Choose "Save as PDF."
  - **Delete** removes an event and its bookings (asks for confirmation first).
  - **Return to home** is visible on every admin screen, including the login screen.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. Open the SQL Editor and run everything in `supabase/schema.sql`. This creates `chiro_events` and `chiro_slots`, and seeds your existing Sept 21, 2026 day as the first event.
   - **Heads up:** this file drops and recreates the slots table. If you ever have real bookings and need to change the schema again later, ask Claude for a data-preserving migration instead of re-running this file as-is.
3. Project Settings > API: copy the Project URL and the `service_role` (or "secret") key, not the `anon`/`public`/"publishable" one.

## 2. Environment variables

Same four as before, set in Vercel under Settings > Environment Variables (or Environments > Production > Environment Variables, depending on Vercel's current layout):

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
```

`ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are both just made up by you, not pulled from anywhere. After adding or changing any of these, you need to **Redeploy** (Deployments tab > ... menu on the latest deployment) for the change to take effect, adding the variable alone doesn't update the live site.

## 3. Run locally (optional)

```
npm install
npm run dev
```

## 4. Creating your next event

No file edits needed. Once deployed:

1. Go to `/admin`, log in.
2. Click **+ New Event**.
3. Fill in the date, time window, slot length, and any breaks.
4. Save. That's it, it becomes the live page automatically once its date arrives (or immediately, if you gave it today's date).

## Notes

- No booking confirmation emails are sent, people use the calendar buttons instead.
- Admin uses one shared password, not individual logins.
- Styling uses the Soberlink brand variables (`#00abdf`, `#17417c`, `#3b73b9`, `#333333`, Century Gothic) in `app/globals.css`.
