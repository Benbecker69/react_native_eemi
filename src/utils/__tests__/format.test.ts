import { formatCredits, formatDateTime, formatDistance, formatTimeRange } from "../format";

// formatDistance/formatCredits are plain arithmetic — asserted exactly.
// formatDateTime/formatTimeRange go through Intl.DateTimeFormat: the exact
// separators (comma, narrow no-break space) are an ICU detail that can
// differ between Node versions, so only the digits that must appear are
// asserted, not the full string — see jest.setup.js for the fixed test TZ.

describe("formatDistance", () => {
  it("returns a placeholder when the distance is unknown", () => {
    expect(formatDistance(null)).toBe("Distance inconnue");
  });

  it("formats short distances in meters, rounded", () => {
    expect(formatDistance(84.6)).toBe("85 m");
  });

  it("formats distances of 1 km or more in kilometers with one decimal", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
  });
});

describe("formatCredits", () => {
  it("uses the singular form for exactly one credit", () => {
    expect(formatCredits(1)).toBe("1 crédit");
  });

  it("uses the plural form for zero or several credits", () => {
    expect(formatCredits(0)).toBe("0 crédits");
    expect(formatCredits(5)).toBe("5 crédits");
  });
});

describe("formatDateTime", () => {
  it("includes the day of month and the local hour:minute", () => {
    // 2026-09-22T09:05:00Z is 2026-09-22 11:05 in Europe/Paris (CEST, +2).
    expect(formatDateTime("2026-09-22T09:05:00.000Z")).toContain("22");
    expect(formatDateTime("2026-09-22T09:05:00.000Z")).toMatch(/11.05/);
  });
});

describe("formatTimeRange", () => {
  it("separates the start (full) and end (time only) with an en dash", () => {
    const range = formatTimeRange("2026-09-22T09:00:00.000Z", "2026-09-22T10:00:00.000Z");
    expect(range).toContain("–");
    expect(range).toMatch(/11.00/);
    expect(range).toMatch(/12.00/);
  });
});
