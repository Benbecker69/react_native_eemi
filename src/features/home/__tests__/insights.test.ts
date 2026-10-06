import { attendanceRate, formatHours, greeting, startsInLabel } from "../insights";

const at = (day: number, hour: number, minute = 0) => new Date(2026, 8, day, hour, minute);
const slot = (start: Date, end: Date) => ({ startAt: start.toISOString(), endAt: end.toISOString() });

describe("greeting", () => {
  it("says Bonjour during the day", () => {
    expect(greeting(at(28, 9), "Camille")).toBe("Bonjour Camille");
  });

  it("says Bonsoir from 18h", () => {
    expect(greeting(at(28, 18), "Camille")).toBe("Bonsoir Camille");
  });

  it("drops the name when there is none", () => {
    expect(greeting(at(28, 9), "")).toBe("Bonjour");
  });
});

describe("startsInLabel", () => {
  const now = at(28, 12);

  it("reads En cours between the start and the end", () => {
    expect(startsInLabel(slot(at(28, 11), at(28, 13)), now)).toBe("En cours");
  });

  it("counts minutes under an hour", () => {
    expect(startsInLabel(slot(at(28, 12, 35), at(28, 14)), now)).toBe("Dans 35 min");
  });

  it("counts whole hours later the same day", () => {
    expect(startsInLabel(slot(at(28, 15, 30), at(28, 17)), now)).toBe("Dans 3 h");
  });

  it("says Demain for the next calendar day, even less than 24 h away", () => {
    expect(startsInLabel(slot(at(29, 9), at(29, 10)), at(28, 23))).toBe("Demain");
  });

  it("counts calendar days beyond tomorrow", () => {
    expect(startsInLabel(slot(at(30, 9), at(30, 10)), now)).toBe("Dans 2 jours");
  });
});

describe("attendanceRate", () => {
  it("is null when no booking has finished yet", () => {
    expect(attendanceRate({ past: 0, attended: 0 })).toBeNull();
  });

  it("rounds to a whole percentage", () => {
    expect(attendanceRate({ past: 3, attended: 2 })).toBe(67);
  });
});

describe("formatHours", () => {
  it("keeps whole hours bare", () => {
    expect(formatHours(12)).toBe("12 h");
  });

  it("uses a decimal comma", () => {
    expect(formatHours(1.5)).toBe("1,5 h");
  });
});
