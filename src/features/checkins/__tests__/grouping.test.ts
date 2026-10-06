import type { CheckInHistoryDto } from "@/types/api";
import { filterCheckInsByDay, groupCheckInsByDay } from "../grouping";

const at = (day: number, hour: number) => new Date(2026, 8, day, hour);

function checkIn(id: string, day: number, hour: number, accepted = true): CheckInHistoryDto {
  return {
    id,
    reservationId: `r-${id}`,
    accepted,
    reason: accepted ? null : "TOO_FAR",
    distanceM: 42,
    accuracyM: 15,
    scannedSpaceId: null,
    createdAt: at(day, hour).toISOString(),
    reservation: {
      id: `r-${id}`,
      startAt: at(day, hour).toISOString(),
      endAt: at(day, hour + 1).toISOString(),
      space: { id: "s1", name: "Salle Ampère", type: "salle-reunion", capacity: 4, pricePerHour: 18 },
      location: { id: "l1", name: "Le Chantier", city: "Lyon", address: "1 rue du Test", lat: 45.7, lng: 4.8 },
    },
  };
}

describe("groupCheckInsByDay", () => {
  const now = at(29, 10);

  it("returns no sections for an empty list", () => {
    expect(groupCheckInsByDay([], now)).toEqual([]);
  });

  it("merges consecutive same-day attempts into one section", () => {
    const items = [checkIn("a", 29, 14), checkIn("b", 29, 9)];
    const sections = groupCheckInsByDay(items, now);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Aujourd’hui");
    expect(sections[0].data.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("starts a new section per day, kept in the order given (newest first)", () => {
    const items = [checkIn("a", 29, 14), checkIn("b", 28, 9)];
    const sections = groupCheckInsByDay(items, now);
    expect(sections.map((s) => s.title)).toEqual(["Aujourd’hui", "Hier"]);
  });

  it("does not merge same-day items separated by a different day in between", () => {
    const items = [checkIn("a", 29, 14), checkIn("b", 28, 9), checkIn("c", 29, 8)];
    expect(groupCheckInsByDay(items, now)).toHaveLength(3);
  });
});

describe("filterCheckInsByDay", () => {
  it("keeps only attempts made on the given local day", () => {
    const items = [checkIn("a", 29, 14), checkIn("b", 28, 9), checkIn("c", 29, 8)];
    expect(filterCheckInsByDay(items, at(29, 0)).map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterCheckInsByDay([checkIn("a", 29, 14)], at(1, 0))).toEqual([]);
  });
});
