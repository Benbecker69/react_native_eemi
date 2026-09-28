import type { NearbySpace } from "@/types/api";
import { filterSpaces, normalizeText } from "../search";

const space = (id: string, name: string, locationName: string, city: string): NearbySpace => ({
  space: { id, name, type: "salle-reunion", capacity: 4, pricePerHour: 18 },
  location: { id: `loc-${id}`, name: locationName, city, address: "1 rue du Test", lat: 45.7, lng: 4.8 },
  distanceM: null,
  estimatedCredits: 18,
  busy: false,
});

const items = [
  space("a", "Salle Ampère", "Le Chantier", "Lyon"),
  space("b", "Bureau privé", "La Verrière", "Lyon"),
  space("c", "Poste flex", "Station 9", "Paris"),
];

describe("normalizeText", () => {
  it("drops accents, case and surrounding spaces", () => {
    expect(normalizeText("  Salle Ampère ")).toBe("salle ampere");
    expect(normalizeText("Verrière")).toBe("verriere");
  });
});

describe("filterSpaces", () => {
  it("keeps everything for an empty or blank query", () => {
    expect(filterSpaces(items, "")).toHaveLength(3);
    expect(filterSpaces(items, "   ")).toHaveLength(3);
  });

  it("finds a space by name whatever the accents and case", () => {
    expect(filterSpaces(items, "ampere").map((i) => i.space.id)).toEqual(["a"]);
    expect(filterSpaces(items, "PRIVE").map((i) => i.space.id)).toEqual(["b"]);
  });

  it("also matches the place and the city", () => {
    expect(filterSpaces(items, "verriere").map((i) => i.space.id)).toEqual(["b"]);
    expect(filterSpaces(items, "paris").map((i) => i.space.id)).toEqual(["c"]);
  });

  it("requires every word typed, in any order", () => {
    expect(filterSpaces(items, "chantier salle").map((i) => i.space.id)).toEqual(["a"]);
    expect(filterSpaces(items, "salle paris")).toEqual([]);
  });

  it("returns nothing when no space matches", () => {
    expect(filterSpaces(items, "zzz")).toEqual([]);
  });
});
