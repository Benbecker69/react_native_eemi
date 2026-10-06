import type { CheckInHistoryDto } from "@/types/api";
// Generic date math and the day-label rule, shared with the reservations
// list — same reasoning as that file's own reuse of `features/booking/calendar.ts`.
import { dayKey, isSameDay } from "@/features/booking/calendar";
import { dayHeaderLabel } from "@/features/reservations/grouping";

export type CheckInSection = { key: string; title: string; data: CheckInHistoryDto[] };

/**
 * Check-in attempts grouped into one section per local day, like a native
 * calendar list. Keyed on the attempt's own `createdAt` — when it was
 * actually tried, not the reservation's slot time. Assumes `items` already
 * come newest-first (as the server returns them): this only merges
 * consecutive same-day items, so it stays correct without re-sorting.
 */
export function groupCheckInsByDay(items: CheckInHistoryDto[], now: Date): CheckInSection[] {
  const sections: CheckInSection[] = [];
  for (const item of items) {
    const createdAt = new Date(item.createdAt);
    const key = dayKey(createdAt);
    const current = sections[sections.length - 1];
    if (current && current.key === key) {
      current.data.push(item);
    } else {
      sections.push({ key, title: dayHeaderLabel(createdAt, now), data: [item] });
    }
  }
  return sections;
}

/** Keeps only the attempts made on the same local day as `day`. */
export function filterCheckInsByDay(items: CheckInHistoryDto[], day: Date): CheckInHistoryDto[] {
  return items.filter((item) => isSameDay(new Date(item.createdAt), day));
}
