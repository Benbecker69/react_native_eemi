// Pure, unit-testable formatting shared by every screen — a date/distance
// computation never belongs inline in a component (see the
// `backend-api-client` skill, "no business rule inside a screen").
// Device-local time zone on purpose (same reasoning as the web app's own
// `toLocaleDateString` calls): the phone is wherever its owner physically is.

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** `startAt` gets the full date, `endAt` only the time — they're always the same day (30 min–12 h slots). */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${dateTimeFormatter.format(new Date(startIso))} – ${timeFormatter.format(new Date(endIso))}`;
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return "Distance inconnue";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatCredits(credits: number): string {
  return `${credits} crédit${credits === 1 ? "" : "s"}`;
}
