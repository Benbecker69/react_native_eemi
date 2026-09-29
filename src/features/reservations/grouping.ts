import type { ReservationDto } from "@/types/api";
// Generic date math, not booking-specific: sharing it across features is the
// same reasoning as reusing `utils/format.ts`.
import { dayKey, startOfDay } from "@/features/booking/calendar";
import { formatDay } from "@/utils/format";

const DAY_MS = 86_400_000;

export type ReservationSection = { key: string; title: string; data: ReservationDto[] };

/** "Aujourd'hui" / "Demain" / "Hier" close to `now`, a short date otherwise ("lun. 28 sept."). */
export function dayHeaderLabel(date: Date, now: Date): string {
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  return formatDay(date);
}

/**
 * Reservations grouped into one section per local day, like a native
 * calendar list. Assumes `items` already come sorted by `startAt` (as the
 * server returns them, ascending for "upcoming" and descending otherwise):
 * this only merges consecutive same-day items, so it stays correct either
 * way without re-sorting.
 */
export function groupReservationsByDay(items: ReservationDto[], now: Date): ReservationSection[] {
  const sections: ReservationSection[] = [];
  for (const item of items) {
    const start = new Date(item.startAt);
    const key = dayKey(start);
    const current = sections[sections.length - 1];
    if (current && current.key === key) {
      current.data.push(item);
    } else {
      sections.push({ key, title: dayHeaderLabel(start, now), data: [item] });
    }
  }
  return sections;
}
