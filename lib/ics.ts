// Builds an RFC 5545 .ics file for a single appointment slot.
export function buildIcs(opts: {
  isoDate: string; // "2026-09-21"
  startTime: string; // "10:00"
  endTime: string; // "10:10"
  title: string;
  location: string;
  attendeeName: string;
}) {
  const { isoDate, startTime, endTime, title, location, attendeeName } = opts;
  const dtStart = toIcsDate(isoDate, startTime);
  const dtEnd = toIcsDate(isoDate, endTime);
  const uid = `${isoDate}-${startTime.replace(":", "")}-${cryptoRandom()}@soberlink.com`;
  const now = toIcsStamp(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Soberlink//Chiro Sign Up//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(`${title} - ${attendeeName}`)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(
      "Your chiropractor appointment slot. Reply is not required. Contact your Soberlink admin if you need to change your time."
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function toIcsDate(isoDate: string, time: string) {
  const [y, m, d] = isoDate.split("-");
  const [h, min] = time.split(":");
  return `${y}${m}${d}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

function toIcsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcs(text: string) {
  return text.replace(/([,;])/g, "\\$1");
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

// Builds the Outlook Web deep link used for the "Outlook Online" button.
export function buildOutlookWebLink(opts: {
  isoDate: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  attendeeName: string;
}) {
  const { isoDate, startTime, endTime, title, location, attendeeName } = opts;
  const startIso = `${isoDate}T${startTime}:00`;
  const endIso = `${isoDate}T${endTime}:00`;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: `${title} - ${attendeeName}`,
    startdt: startIso,
    enddt: endIso,
    location,
    body: "Your chiropractor appointment slot.",
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
