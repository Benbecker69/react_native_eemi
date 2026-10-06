import type { NearbySpace } from "@/types/api";
import { filterByLocation, groupByLocation, mapsUrl, randomDecoyRegion, regionFor } from "../map";

const space = (id: string, locationId: string, busy: boolean, lat = 45.76, lng = 4.86): NearbySpace => ({
  space: { id, name: `Espace ${id}`, type: "salle-reunion", capacity: 4, pricePerHour: 18 },
  location: { id: locationId, name: `Lieu ${locationId}`, city: "Lyon", address: "1 rue du Test", lat, lng },
  distanceM: null,
  estimatedCredits: 18,
  busy,
});

describe("groupByLocation", () => {
  const items = [
    space("a", "chantier", false),
    space("b", "verriere", true),
    space("c", "chantier", true),
    space("d", "chantier", false),
  ];

  it("makes one pin per place, in order of first appearance", () => {
    expect(groupByLocation(items).map((pin) => pin.location.id)).toEqual(["chantier", "verriere"]);
  });

  it("counts the spaces of each place and how many are free", () => {
    const [chantier, verriere] = groupByLocation(items);
    expect(chantier).toMatchObject({ spaceCount: 3, freeCount: 2 });
    expect(verriere).toMatchObject({ spaceCount: 1, freeCount: 0 });
  });

  it("returns nothing for an empty list", () => {
    expect(groupByLocation([])).toEqual([]);
  });
});

describe("filterByLocation", () => {
  const items = [space("a", "chantier", false), space("b", "verriere", false)];

  it("keeps only the spaces of the chosen place", () => {
    expect(filterByLocation(items, "verriere").map((item) => item.space.id)).toEqual(["b"]);
  });

  it("keeps everything when no place is chosen", () => {
    expect(filterByLocation(items, null)).toEqual(items);
  });
});

describe("regionFor", () => {
  it("is null when there is nothing to show", () => {
    expect(regionFor([])).toBeNull();
  });

  it("frames a single place at street level, centred on it", () => {
    expect(regionFor([{ lat: 45.7605, lng: 4.8607 }])).toEqual({
      latitude: 45.7605,
      longitude: 4.8607,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  });

  it("centres several places and leaves room around the outermost ones", () => {
    const region = regionFor([
      { lat: 44, lng: -1 },
      { lat: 48, lng: 5 },
    ]);
    expect(region?.latitude).toBe(46);
    expect(region?.longitude).toBe(2);
    // The box is 4° by 6°: the region is wider than that, never tighter.
    expect(region?.latitudeDelta).toBeGreaterThan(4);
    expect(region?.longitudeDelta).toBeGreaterThan(6);
  });

  it("never zooms in past street level, even for two places side by side", () => {
    const region = regionFor([
      { lat: 45.76, lng: 4.86 },
      { lat: 45.7601, lng: 4.8601 },
    ]);
    expect(region?.latitudeDelta).toBe(0.01);
  });
});

describe("randomDecoyRegion", () => {
  it("picks the first city for the lowest draw and the last one for the highest", () => {
    expect(randomDecoyRegion(() => 0).latitude).toBeCloseTo(48.8566); // Paris
    expect(randomDecoyRegion(() => 0.999999).latitude).toBeCloseTo(47.2184); // Besançon
  });

  it("never reads past the list, even for a draw of exactly 1", () => {
    expect(randomDecoyRegion(() => 1).latitude).toBeCloseTo(47.2184);
  });

  it("frames the city, not the whole country", () => {
    const region = randomDecoyRegion(() => 0.5);
    expect(region.latitudeDelta).toBeLessThan(0.2);
    expect(region.longitudeDelta).toBeLessThan(0.2);
  });
});

describe("mapsUrl", () => {
  it("centres Plans on the coordinates and names the pin", () => {
    expect(mapsUrl({ name: "Le Chantier", lat: 45.7605, lng: 4.8607 })).toBe(
      "http://maps.apple.com/?ll=45.7605,4.8607&q=Le%20Chantier",
    );
  });
});
