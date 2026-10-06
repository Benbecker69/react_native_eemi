import {
  formatCredits,
  formatCreditsSpent,
  formatDateTime,
  formatDayHeading,
  formatDistance,
  formatHourRange,
  formatSlotLabel,
  formatTime,
  formatTimeRange,
  spaceTypeLabel,
} from "../format";

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

describe("formatCreditsSpent", () => {
  it("prefixes the cost with a minus and keeps the plural rule", () => {
    expect(formatCreditsSpent(3)).toBe("-3 crédits");
    expect(formatCreditsSpent(1)).toBe("-1 crédit");
  });
});

describe("formatSlotLabel", () => {
  it("shows the day, the hour range and its length", () => {
    const label = formatSlotLabel(new Date(2026, 8, 28), 14, 17);
    expect(label).toContain("28");
    expect(label).toContain("14h–17h");
    expect(label).toContain("3 h");
  });
});

describe("formatDayHeading", () => {
  it("capitalizes only the first letter, leaving the month lowercase", () => {
    expect(formatDayHeading(new Date(2026, 8, 28))).toBe("Lundi 28 septembre");
  });
});

describe("formatHourRange", () => {
  it("shows a whole-hour range without minutes", () => {
    expect(formatHourRange("2026-09-28T12:00:00.000Z", "2026-09-28T15:00:00.000Z")).toBe("14h–17h");
  });

  it("keeps the minutes of an older 30-minute-aligned booking", () => {
    expect(formatHourRange("2026-09-28T12:30:00.000Z", "2026-09-28T14:00:00.000Z")).toBe("14h30–16h");
  });
});

describe("spaceTypeLabel", () => {
  it("translates every known space type", () => {
    expect(spaceTypeLabel("salle-reunion")).toBe("Salle de réunion");
    expect(spaceTypeLabel("bureau-prive")).toBe("Bureau privé");
    expect(spaceTypeLabel("poste-flex")).toBe("Poste flex");
    expect(spaceTypeLabel("phone-booth")).toBe("Phone booth");
  });

  it("passes an unrecognized type through unchanged", () => {
    expect(spaceTypeLabel("futuriste")).toBe("futuriste");
  });
});

describe("formatTime", () => {
  it("formats a whole hour without minutes", () => {
    expect(formatTime("2026-09-28T12:00:00.000Z")).toBe("14h");
  });

  it("keeps the minutes when not on the hour", () => {
    expect(formatTime("2026-09-28T12:30:00.000Z")).toBe("14h30");
  });
});
