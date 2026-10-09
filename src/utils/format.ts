import type { CheckInReason } from "@/types/api";

// Pure, unit-testable formatting shared by every screen — a date/distance
// computation never belongs inline in a component.
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

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Short day label for the booking grid ("lun. 28 sept."). */
export function formatDay(date: Date): string {
  return dayFormatter.format(date);
}

const monthTitleFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const dayLongFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "septembre 2026" — the calendar header. */
export function formatMonthTitle(date: Date): string {
  return monthTitleFormatter.format(date);
}

/** "lundi 28 septembre" — the spoken label of a calendar day (VoiceOver). */
export function formatDayLong(date: Date): string {
  return dayLongFormatter.format(date);
}

/** Same, capitalized for an on-screen heading ("Lundi 28 septembre") — VoiceOver ignores case, so `formatDayLong` stays as-is for accessibility labels. */
export function formatDayHeading(date: Date): string {
  const label = dayLongFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const weekdayShortFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const monthShortFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/** The three lines of a small calendar tile: "lun.", "28", "sept.". */
export function formatDayParts(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: weekdayShortFormatter.format(date),
    day: String(date.getDate()),
    month: monthShortFormatter.format(date),
  };
}

/** A booking as shown on the booking screens ("lun. 28 sept., 14h–17h · 3 h"). */
export function formatSlotLabel(day: Date, startHour: number, endHour: number): string {
  return `${dayFormatter.format(day)}, ${startHour}h–${endHour}h · ${endHour - startHour} h`;
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** `startAt` gets the full date, `endAt` only the time — they're always the same day (30 min–12 h slots). */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${dateTimeFormatter.format(new Date(startIso))} – ${timeFormatter.format(new Date(endIso))}`;
}

function formatHourMinute(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0 ? `${date.getHours()}h` : `${date.getHours()}h${String(minutes).padStart(2, "0")}`;
}

/** Just the hours ("14h–17h", or "14h30–16h" for an older 30-minute-aligned booking) — for a day already shown elsewhere (a section header, a calendar day). */
export function formatHourRange(startIso: string, endIso: string): string {
  return `${formatHourMinute(new Date(startIso))}–${formatHourMinute(new Date(endIso))}`;
}

/** A single point in time, hour only ("14h30") — for a day already shown elsewhere (a section header). */
export function formatTime(iso: string): string {
  return formatHourMinute(new Date(iso));
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return "Distance inconnue";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Mirrors the web app's own `SPACE_TYPE_LABELS` (`src/types/domain.ts` there):
// same four values, same French wording.
const SPACE_TYPE_LABELS: Record<string, string> = {
  "poste-flex": "Poste flex",
  "bureau-prive": "Bureau privé",
  "salle-reunion": "Salle de réunion",
  "phone-booth": "Phone booth",
};

/** French label for a space's type. An unrecognized value passes through unchanged (forward-compatible with a type this build doesn't know about yet). */
export function spaceTypeLabel(type: string): string {
  return SPACE_TYPE_LABELS[type] ?? type;
}

export function formatCredits(credits: number): string {
  return `${credits} crédit${credits === 1 ? "" : "s"}`;
}

/** What a booking takes off the balance: "-3 crédits" (shown in the danger color). */
export function formatCreditsSpent(cost: number): string {
  return `-${formatCredits(cost)}`;
}

/** Shared by the History list and the check-in result on a reservation's detail screen. */
export function checkInReasonLabel(reason: CheckInReason | null): string {
  switch (reason) {
    case "TOO_EARLY":
      return "Trop tôt";
    case "TOO_LATE":
      return "Trop tard";
    case "TOO_FAR":
      return "Trop loin";
    case "LOW_ACCURACY":
      return "Précision insuffisante";
    case "STALE_POSITION":
      return "Position trop ancienne";
    case "NOT_CONFIRMED":
      return "Réservation non confirmée";
    case "WRONG_SPACE":
      return "Mauvais espace scanné";
    default:
      return "Refusée";
  }
}
