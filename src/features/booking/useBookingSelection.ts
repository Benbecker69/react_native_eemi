import { useState } from "react";
import type { BusySlot } from "@/types/api";
import { dayKey, startOfDay } from "./calendar";
import { defaultBookingDay, firstBookableHour } from "./slots";

// Two small hooks rather than one: the screen must know the DATE before it
// can fetch that day's busy slots, and the hour range needs those busy slots
// for its defaults. Both derive their defaults while rendering (no effect —
// the React Compiler lint forbids setState in an effect).

/** The day being booked: what the user tapped, otherwise the first day still open. */
export function useBookingDate() {
  const [picked, setPicked] = useState<Date | null>(null);
  const date = picked ?? defaultBookingDay(new Date());
  return { date, selectDate: (value: Date) => setPicked(startOfDay(value)) };
}

type HourChoice = { key: string; start: number | null; end: number | null };

/**
 * The start and end hour of the booking on `date`. What the user tapped wins
 * (and is forgotten when the day changes); until then, with `preselect`, the
 * first bookable hour is proposed as a one-hour booking so the one-tap flow
 * still works. Pass `busySlots` as `undefined` while they are loading.
 */
export function useHourRange(
  date: Date,
  busySlots: BusySlot[] | undefined,
  options: { preselect: boolean },
) {
  const key = dayKey(date);
  const [choice, setChoice] = useState<HourChoice | null>(null);

  const active = choice && choice.key === key ? choice : null;
  const first = options.preselect && busySlots ? firstBookableHour(date, busySlots, new Date()) : null;
  const startHour = active ? active.start : first;
  const endHour = active ? active.end : first === null ? null : first + 1;

  return {
    startHour,
    endHour,
    // A new start hour resets the end to one hour later: the old end may no longer fit.
    selectStart: (hour: number) => setChoice({ key, start: hour, end: hour + 1 }),
    selectEnd: (hour: number) => setChoice({ key, start: startHour, end: hour }),
  };
}
