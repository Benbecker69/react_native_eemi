import { startOfDay } from "@/features/booking/calendar";
import type { ReservationDto } from "@/types/api";

// Small display rules of the home screen. Pure and unit-tested, like every
// other rule in `features/` — the screen only arranges what these return.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "Bonjour" until 18h, "Bonsoir" after — with the first name when there is one. */
export function greeting(now: Date, firstName: string): string {
  const word = now.getHours() < 18 ? "Bonjour" : "Bonsoir";
  return firstName ? `${word} ${firstName}` : word;
}

/**
 * How far away a reservation is, in the words someone would use: "En cours",
 * "Dans 35 min", "Dans 3 h", "Demain", "Dans 4 jours". Days are calendar
 * days, not 24-hour blocks: at 23h, a booking at 9h the next morning is
 * "Demain", not "Dans 10 h".
 */
export function startsInLabel(reservation: Pick<ReservationDto, "startAt" | "endAt">, now: Date): string {
  const start = new Date(reservation.startAt);
  const end = new Date(reservation.endAt);
  if (now >= start && now <= end) return "En cours";

  const days = Math.round((startOfDay(start).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (days === 1) return "Demain";
  if (days > 1) return `Dans ${days} jours`;

  const ms = start.getTime() - now.getTime();
  if (ms < HOUR_MS) return `Dans ${Math.max(1, Math.round(ms / MINUTE_MS))} min`;
  return `Dans ${Math.floor(ms / HOUR_MS)} h`;
}

/** Share of finished bookings with a validated arrival, 0–100. `null` when there is nothing to measure yet. */
export function attendanceRate(attendance: { past: number; attended: number }): number | null {
  if (attendance.past === 0) return null;
  return Math.round((attendance.attended / attendance.past) * 100);
}

/** "12 h", "1,5 h" — French decimal comma, no trailing ",0". */
export function formatHours(hours: number): string {
  return `${String(hours).replace(".", ",")} h`;
}
