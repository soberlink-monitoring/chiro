# Soberlink Chiropractor Sign Up

A branded sign-up page for Dr. John's chiropractor visit on **Monday, September 21, 2026, 10:00 am to 1:00 pm**. Built with Next.js and Supabase, ready to deploy on Vercel.

## What it does

- Public page at `/` shows every 10-minute time slot as a rounded card. Breaks are baked into the schedule (10:40, 11:30, 12:20) but never appear as bookable, so they never show up on this page.
- Click an open slot, enter your name and email, and it's booked. You then get two "add to calendar" buttons: Outlook Online and Outlook Desktop (downloads a `.ics` file that works with desktop Outlook, Apple Calendar, Google Calendar, etc).
- Once booked, anyone who refreshes sees that slot as "Booked."
- Click a booked slot to release it yourself. You must re-enter the same name and email you booked with, or it won't release.
- `/admin` is a password-protected page (top-right "Admin" link from the main page) where staff can see every name and email and release any slot on someone's behalf, no matching required.
- From `/admin`, "Print / Export PDF" opens `/print`, a clean ordered list (including the BREAK rows, for a readable full-day schedule) that auto-opens the browser print dialog. Choose "Save as PDF" as the destination, exactly like the original sheet was exported.

## Your stack question

GitHub + Vercel + Supabase is the right call here, and it's exactly what this project is built for:

- **Supabase** gives you a hosted Postgres table for the bookings, which is all this needs. No auth setup on the Supabase side is required. The app talks to Supabase only from the server (API routes) using a service role key, so the browser never touches your Supabase project directly.
- **Vercel** deploys Next.js with zero config once you set the environment variables.
- **GitHub** just holds the code and triggers Vercel deploys on push.

## 1. Set up Supabase

1. Create a project at supabase.com (the free tier is plenty for this).
2. Open the SQL Editor and run everything in `supabase/schema.sql`. This creates the `chiro_slots` table and seeds the 15 bookable slots for Sept 21, 2026.
3. Go to Project Settings > API and copy:
   - Project URL
   - `service_role` secret key (not the `anon` key)

## 2. Configure environment variables

Copy `.env.example` to `.env.local` for local dev, and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=choose-something-only-staff-know
ADMIN_SESSION_SECRET=openssl rand -hex 32
```

You'll set these same four variables in Vercel (Project Settings > Environment Variables) when you deploy.

## 3. Run locally (optional)

```
npm install
npm run dev
```

Open http://localhost:3000. Admin is at http://localhost:3000/admin.

## 4. Push to GitHub and deploy to Vercel

1. Create a new GitHub repo, push this folder to it.
2. In Vercel, "Add New Project," import that repo. Vercel auto-detects Next.js.
3. Add the four environment variables from step 2 before the first deploy (or add them and redeploy).
4. Deploy. Share the Vercel URL with the team.

## Reusing this for a future chiro day

Two places to change:

1. `lib/eventConfig.ts` — update `dateLabel`, `isoDate`, and `windowLabel`.
2. `supabase/schema.sql` — update the date and re-run the seed `insert` block (or truncate and reseed the table) for the new day's slots.

Everything else (branding, booking flow, admin, PDF export) stays the same.

## Notes

- No email confirmations are sent. If you want a confirmation email on booking, that would need an email provider (Resend, Postmark, or similar) wired into `/app/api/book/route.ts`. Happy to add that if useful.
- The admin password is a single shared password, not individual logins. That matches how the original sheet's admin panel worked, but let me know if you'd rather have per-person admin accounts.
- Styling uses the Soberlink brand variables (`#00abdf`, `#17417c`, `#3b73b9`, `#333333`, Century Gothic) directly in `app/globals.css`.
