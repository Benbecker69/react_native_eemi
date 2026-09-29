import type { ReservationDto } from "@/types/api";
import { dayHeaderLabel, groupReservationsByDay } from "../grouping";

const at = (day: number, hour: number) => new Date(2026, 8, day, hour);

function reservation(id: string, day: number, hour: number): ReservationDto {
  return {
    id,
    status: "confirmed",
    startAt: at(day, hour).toISOString(),
    endAt: at(day, hour + 1).toISOString(),
    creditsSpent: 18,
    createdAt: at(day, hour).toISOString(),
    space: { id: "s1", name: "Salle Ampère", type: "salle-reunion", capacity: 4, pricePerHour: 18 },
    location: { id: "l1", name: "Le Chantier", city: "Lyon", address: "1 rue du Test", lat: 45.7, lng: 4.8 },
    checkIn: { state: "unavailable", opensAt: at(day, hour).toISOString(), closesAt: at(day, hour + 1).toISOString(), doneAt: null },
  };
}

describe("dayHeaderLabel", () => {
  const now = at(28, 9);

  it("names today, tomorrow and yesterday", () => {
    expect(dayHeaderLabel(at(28, 14), now)).toBe("Aujourd’hui");
    expect(dayHeaderLabel(at(29, 14), now)).toBe("Demain");
    expect(dayHeaderLabel(at(27, 14), now)).toBe("Hier");
  });

  it("falls back to a short date for any other day", () => {
    expect(dayHeaderLabel(at(30, 14), now)).toContain("30");
    expect(dayHeaderLabel(at(20, 14), now)).toContain("20");
  });

  it("ignores the time of day, only the calendar day matters", () => {
    expect(dayHeaderLabel(new Date(2026, 8, 28, 23, 59), at(28, 0))).toBe("Aujourd’hui");
  });
});

describe("groupReservationsByDay", () => {
  const now = at(28, 9);

  it("returns no sections for an empty list", () => {
    expect(groupReservationsByDay([], now)).toEqual([]);
  });

  it("merges consecutive reservations on the same day into one section", () => {
    const items = [reservation("a", 28, 10), reservation("b", 28, 15)];
    const sections = groupReservationsByDay(items, now);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Aujourd’hui");
    expect(sections[0].data.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("starts a new section for each different day, ascending order kept as given", () => {
    const items = [reservation("a", 28, 10), reservation("b", 29, 9), reservation("c", 29, 15)];
    const sections = groupReservationsByDay(items, now);
    expect(sections.map((s) => s.title)).toEqual(["Aujourd’hui", "Demain"]);
    expect(sections[1].data.map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("also works on a descending list (past/all scopes), without reordering", () => {
    const items = [reservation("c", 29, 15), reservation("b", 29, 9), reservation("a", 28, 10)];
    const sections = groupReservationsByDay(items, now);
    expect(sections.map((s) => s.title)).toEqual(["Demain", "Aujourd’hui"]);
    expect(sections[0].data.map((item) => item.id)).toEqual(["c", "b"]);
  });

  it("does not merge same-day items separated by a different day in between", () => {
    const items = [reservation("a", 28, 8), reservation("b", 29, 8), reservation("c", 28, 20)];
    const sections = groupReservationsByDay(items, now);
    expect(sections).toHaveLength(3);
  });
});
