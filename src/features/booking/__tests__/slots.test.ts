import type { BusySlot } from "@/types/api";
import {
  defaultBookingDay,
  dayWindow,
  endHoursFor,
  firstBookableHour,
  isRangeBookable,
  isSlotBookable,
  isSlotPast,
  isSlotTaken,
  maxBookingDate,
  rangeCost,
  slotRange,
} from "../slots";

// Local-time constructors on purpose (see jest.setup.js for the fixed test
// TZ): the rules are about the device's wall clock, like the screens.
const at = (month: number, day: number, hour: number, minute = 0) =>
  new Date(2026, month, day, hour, minute);
const busy = (day: number, fromHour: number, toHour: number): BusySlot => ({
  startAt: at(8, day, fromHour).toISOString(),
  endAt: at(8, day, toHour).toISOString(),
});

describe("isSlotPast", () => {
  const today = at(8, 28, 0);

  it("treats the slot in progress as past: at 14:40 the 14h slot is not bookable", () => {
    expect(isSlotPast(today, 14, at(8, 28, 14, 40))).toBe(true);
  });

  it("keeps the next full hour bookable", () => {
    expect(isSlotPast(today, 15, at(8, 28, 14, 40))).toBe(false);
  });

  it("keeps a slot bookable at the exact minute it starts", () => {
    expect(isSlotPast(today, 15, at(8, 28, 15, 0))).toBe(false);
  });

  it("never treats a later day as past", () => {
    expect(isSlotPast(at(8, 29, 0), 9, at(8, 28, 17, 59))).toBe(false);
  });
});

describe("isSlotTaken", () => {
  const day = at(8, 29, 0);

  it("flags an hour covered by a confirmed reservation", () => {
    expect(isSlotTaken(day, 10, [busy(29, 10, 11)])).toBe(true);
  });

  it("flags every hour a longer reservation overlaps", () => {
    const slots = [busy(29, 10, 13)];
    expect([10, 11, 12].map((hour) => isSlotTaken(day, hour, slots))).toEqual([true, true, true]);
  });

  it("does not block the hour that starts right when a reservation ends", () => {
    expect(isSlotTaken(day, 11, [busy(29, 10, 11)])).toBe(false);
  });
});

describe("isRangeBookable", () => {
  const now = at(8, 28, 8, 0);
  const day = at(8, 29, 0);

  it("accepts a free multi-hour range such as 14h to 17h", () => {
    expect(isRangeBookable(day, 14, 17, [], now)).toBe(true);
  });

  it("refuses a range as soon as one hour inside it is taken", () => {
    expect(isRangeBookable(day, 14, 17, [busy(29, 15, 16)], now)).toBe(false);
  });

  it("allows a range that ends exactly where another reservation starts", () => {
    expect(isRangeBookable(day, 14, 16, [busy(29, 16, 17)], now)).toBe(true);
  });

  it("refuses a range whose first hour has already started", () => {
    expect(isRangeBookable(at(8, 28, 0), 14, 16, [], at(8, 28, 14, 40))).toBe(false);
  });

  it("refuses ranges outside business hours or with no length", () => {
    expect(isRangeBookable(day, 8, 10, [], now)).toBe(false);
    expect(isRangeBookable(day, 16, 19, [], now)).toBe(false);
    expect(isRangeBookable(day, 14, 14, [], now)).toBe(false);
    expect(isRangeBookable(day, 15, 14, [], now)).toBe(false);
  });
});

describe("firstBookableHour", () => {
  const today = at(8, 28, 0);

  it("is the next full hour, never the one in progress", () => {
    expect(firstBookableHour(today, [], at(8, 28, 14, 40))).toBe(15);
  });

  it("skips hours that are already taken", () => {
    expect(firstBookableHour(today, [busy(28, 15, 17)], at(8, 28, 14, 40))).toBe(17);
  });

  it("returns null once the last slot of the day has started", () => {
    expect(firstBookableHour(today, [], at(8, 28, 17, 30))).toBeNull();
  });
});

describe("isSlotBookable", () => {
  it("combines the past and taken rules", () => {
    const now = at(8, 28, 14, 40);
    const day = at(8, 28, 0);
    expect(isSlotBookable(day, 14, [], now)).toBe(false);
    expect(isSlotBookable(day, 15, [busy(28, 15, 16)], now)).toBe(false);
    expect(isSlotBookable(day, 16, [busy(28, 15, 16)], now)).toBe(true);
  });
});

describe("defaultBookingDay", () => {
  it("is today while a slot can still start today", () => {
    expect(defaultBookingDay(at(8, 28, 14, 40))).toEqual(at(8, 28, 0));
    expect(defaultBookingDay(at(8, 28, 17, 0))).toEqual(at(8, 28, 0));
  });

  it("is tomorrow once the last slot of the day has started", () => {
    expect(defaultBookingDay(at(8, 28, 17, 30))).toEqual(at(8, 29, 0));
  });
});

describe("endHoursFor", () => {
  it("lists every possible end, up to closing time", () => {
    expect(endHoursFor(14)).toEqual([15, 16, 17, 18]);
    expect(endHoursFor(17)).toEqual([18]);
  });
});

describe("slotRange / rangeCost / dayWindow / maxBookingDate", () => {
  it("builds the ISO range of a multi-hour booking", () => {
    const { startAt, endAt } = slotRange(at(8, 29, 0), 14, 17);
    expect(startAt).toBe(at(8, 29, 14).toISOString());
    expect(endAt).toBe(at(8, 29, 17).toISOString());
  });

  it("prices like the server: price per hour × hours", () => {
    expect(rangeCost(18, 14, 17)).toBe(54);
    expect(rangeCost(18, 9, 10)).toBe(18);
  });

  it("covers exactly one local day", () => {
    const { from, to } = dayWindow(at(8, 29, 0));
    expect(from).toBe(at(8, 29, 0).toISOString());
    expect(to).toBe(at(8, 30, 0).toISOString());
  });

  it("stops the calendar exactly one month after today", () => {
    expect(maxBookingDate(at(8, 28, 14))).toEqual(new Date(2026, 9, 28, 23, 59, 59, 999));
  });

  it("clamps to the end of a shorter month and crosses the year boundary", () => {
    expect(maxBookingDate(new Date(2026, 0, 31, 10))).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
    expect(maxBookingDate(new Date(2026, 11, 15, 10))).toEqual(new Date(2027, 0, 15, 23, 59, 59, 999));
  });
});
