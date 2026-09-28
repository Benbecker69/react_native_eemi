import { addMonths, buildMonthGrid, dayKey, endOfMonth, isSameDay, startOfDay, startOfMonth } from "../calendar";

describe("buildMonthGrid", () => {
  // 1 September 2026 is a Tuesday: one blank before it (Monday first).
  const weeks = buildMonthGrid(new Date(2026, 8, 1));

  it("builds full rows of 7 cells", () => {
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks).toHaveLength(5);
  });

  it("starts the month on the right weekday and pads with blanks", () => {
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]).toEqual(new Date(2026, 8, 1));
    expect(weeks[4][6]).toBeNull();
  });

  it("holds every day of the month exactly once", () => {
    const days = weeks.flat().filter((cell): cell is Date => cell !== null);
    expect(days).toHaveLength(30);
    expect(days[29]).toEqual(new Date(2026, 8, 30));
  });

  it("puts a month that starts on a Monday flush left", () => {
    // 1 June 2026 is a Monday.
    expect(buildMonthGrid(new Date(2026, 5, 1))[0][0]).toEqual(new Date(2026, 5, 1));
  });
});

describe("month arithmetic", () => {
  it("moves across a year boundary and always returns the first of the month", () => {
    expect(addMonths(new Date(2026, 10, 15), 2)).toEqual(new Date(2027, 0, 1));
    expect(addMonths(new Date(2026, 0, 31), -1)).toEqual(new Date(2025, 11, 1));
  });

  it("finds the first and last instant of a month", () => {
    expect(startOfMonth(new Date(2026, 8, 17, 12))).toEqual(new Date(2026, 8, 1));
    expect(endOfMonth(new Date(2026, 8, 1)).getDate()).toBe(30);
    expect(endOfMonth(new Date(2028, 1, 1)).getDate()).toBe(29); // leap year
  });
});

describe("day helpers", () => {
  it("compares days regardless of the time", () => {
    expect(isSameDay(new Date(2026, 8, 28, 1), new Date(2026, 8, 28, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 28), new Date(2026, 8, 29))).toBe(false);
  });

  it("builds a zero-padded per-day key", () => {
    expect(dayKey(new Date(2026, 0, 5, 18))).toBe("2026-01-05");
    expect(dayKey(new Date(2026, 11, 25))).toBe("2026-12-25");
  });

  it("drops the time of day", () => {
    expect(startOfDay(new Date(2026, 8, 28, 14, 40))).toEqual(new Date(2026, 8, 28));
  });
});
