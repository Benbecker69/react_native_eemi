import type { BusySlot } from "@/types/api";
import { addMonths, endOfMonth, startOfDay, startOfMonth } from "./calendar";

// Pure booking rules shared by the two booking screens (`space/[id]` and
// `reserve`) — a rule about which hours can be booked never lives inside a
// component (see the `backend-api-client` skill, "no business rule inside a
// screen"). Times are device-local on purpose, like `utils/format.ts`.

// Same business hours as the web booking flow (`(app)/reserver/[spaceId]/
// _components/creneau-picker.tsx`) — a space isn't bookable outside them on
// either platform, and both must agree on what "available" means.
export const OPENING_HOUR = 9;
export const CLOSING_HOUR = 18; // a booking ends at 18:00 at the latest
/**
 * How far ahead a booking can start: from today up to the same day one month
 * later. The server enforces its own (slightly wider) limit, `SLOT_TOO_FAR`.
 */
export const BOOKING_HORIZON_MONTHS = 1;

/** Hours a booking can start at: 9h … 17h. */
export const BOOKABLE_HOURS: number[] = Array.from(
  { length: CLOSING_HOUR - OPENING_HOUR },
  (_, i) => OPENING_HOUR + i,
);

/** Hours a booking that starts at `startHour` can end at: `startHour + 1` … 18h. */
export function endHoursFor(startHour: number): number[] {
  return Array.from({ length: CLOSING_HOUR - startHour }, (_, i) => startHour + 1 + i);
}

export function slotStart(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

/** The whole local day as the ISO `from`/`to` the availability endpoint takes. */
export function dayWindow(day: Date): { from: string; to: string } {
  return {
    from: slotStart(day, 0).toISOString(),
    to: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString(),
  };
}

export function minBookingDate(now: Date): Date {
  return startOfDay(now);
}

/** Last bookable day: today's date one month later (28 Sept → 28 Oct, 31 Jan → 28 Feb). */
export function maxBookingDate(now: Date): Date {
  const targetMonth = addMonths(startOfMonth(now), BOOKING_HORIZON_MONTHS);
  const lastDayOfTargetMonth = endOfMonth(targetMonth).getDate();
  const day = Math.min(now.getDate(), lastDayOfTargetMonth);
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day, 23, 59, 59, 999);
}

/** Today while a slot can still start today, tomorrow once the last one has. */
export function defaultBookingDay(now: Date): Date {
  const today = startOfDay(now);
  const lastStartToday = slotStart(today, CLOSING_HOUR - 1);
  if (lastStartToday.getTime() >= now.getTime()) return today;
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
}

/**
 * A slot whose start is already behind us can't be booked: at 14:40 the 14h
 * slot is over even though it ends at 15h. The server enforces the same rule
 * (`SLOT_IN_PAST`, with a small clock-drift tolerance); this only keeps the
 * grid from offering it.
 */
export function isSlotPast(day: Date, hour: number, now: Date): boolean {
  return slotStart(day, hour).getTime() < now.getTime();
}

export function isSlotTaken(day: Date, hour: number, busySlots: BusySlot[]): boolean {
  const start = slotStart(day, hour).getTime();
  const end = slotStart(day, hour + 1).getTime();
  return busySlots.some(
    (slot) => start < new Date(slot.endAt).getTime() && end > new Date(slot.startAt).getTime(),
  );
}

/** One-hour slot: not started yet and not overlapped by a confirmed reservation. */
export function isSlotBookable(day: Date, hour: number, busySlots: BusySlot[], now: Date): boolean {
  return !isSlotPast(day, hour, now) && !isSlotTaken(day, hour, busySlots);
}

/** A `startHour`→`endHour` booking: inside business hours, and every hour in it bookable. */
export function isRangeBookable(
  day: Date,
  startHour: number,
  endHour: number,
  busySlots: BusySlot[],
  now: Date,
): boolean {
  if (startHour < OPENING_HOUR || endHour > CLOSING_HOUR || endHour <= startHour) return false;
  for (let hour = startHour; hour < endHour; hour++) {
    if (!isSlotBookable(day, hour, busySlots, now)) return false;
  }
  return true;
}

/** Earliest hour still bookable on `day`, or `null` when the day is full or over. */
export function firstBookableHour(day: Date, busySlots: BusySlot[], now: Date): number | null {
  return BOOKABLE_HOURS.find((hour) => isSlotBookable(day, hour, busySlots, now)) ?? null;
}

/** The booking as the ISO strings the API expects. */
export function slotRange(
  day: Date,
  startHour: number,
  endHour: number,
): { startAt: string; endAt: string } {
  return {
    startAt: slotStart(day, startHour).toISOString(),
    endAt: slotStart(day, endHour).toISOString(),
  };
}

/** Same formula as the server (`computeCredits`): price per hour × hours, rounded. */
export function rangeCost(pricePerHour: number, startHour: number, endHour: number): number {
  return Math.round(pricePerHour * (endHour - startHour));
}
