import type { LocationDto, NearbySpace } from "@/types/api";

// What the booking map shows and how it frames it. Pure and unit-tested, like
// every other rule in `features/` — the map component only draws what these
// return.

/** One pin on the map: a place, and what it has to offer. */
export type LocationPin = {
  location: LocationDto;
  /** Spaces of this place in the list. */
  spaceCount: number;
  /** Of those, the ones free right now. */
  freeCount: number;
};

/**
 * One pin per place, however many of its spaces are listed. The place's
 * coordinates are the only ones the server has: a `Space` has none of its
 * own. Pins keep the order the places first appear in.
 */
export function groupByLocation(items: NearbySpace[]): LocationPin[] {
  const pins = new Map<string, LocationPin>();
  for (const item of items) {
    const pin = pins.get(item.location.id) ?? {
      location: item.location,
      spaceCount: 0,
      freeCount: 0,
    };
    pin.spaceCount += 1;
    if (!item.busy) pin.freeCount += 1;
    pins.set(item.location.id, pin);
  }
  return [...pins.values()];
}

/** Keeps the spaces of one place; `null` keeps everything. */
export function filterByLocation(items: NearbySpace[], locationId: string | null): NearbySpace[] {
  if (!locationId) return items;
  return items.filter((item) => item.location.id === locationId);
}

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// About one kilometre: what a single place is framed at — close enough to
// read the street, far enough to see the neighbourhood around it.
const MIN_DELTA = 0.01;
// Breathing room around the outermost pins, so none sits on the map's edge.
const PADDING = 1.6;

/**
 * The map region that shows every point. One point is framed at street
 * level; several are framed by their bounding box plus some padding.
 * `null` when there is nothing to show.
 */
export function regionFor(points: { lat: number; lng: number }[]): MapRegion | null {
  if (points.length === 0) return null;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * PADDING, MIN_DELTA),
  };
}

// Cities with nothing to do with the places Repère lists: the locked map is
// centred on one of them, so it looks like a real map without giving away
// where the real places are.
const DECOY_CITIES: { latitude: number; longitude: number }[] = [
  { latitude: 48.8566, longitude: 2.3522 }, // Paris
  { latitude: 43.2965, longitude: 5.3698 }, // Marseille
  { latitude: 43.6047, longitude: 1.4442 }, // Toulouse
  { latitude: 48.5734, longitude: 7.7521 }, // Strasbourg
  { latitude: 43.7102, longitude: 7.262 }, // Nice
  { latitude: 48.1173, longitude: -1.6778 }, // Rennes
  { latitude: 43.6108, longitude: 3.8767 }, // Montpellier
  { latitude: 47.2184, longitude: 6.0241 }, // Besançon
];

/**
 * A made-up place to frame the locked map on, picked at random among
 * `DECOY_CITIES` at city level. `random` is injectable (like a clock) so the
 * pick can be tested; in the app it is `Math.random`.
 */
export function randomDecoyRegion(random: () => number = Math.random): MapRegion {
  const city = DECOY_CITIES[Math.min(Math.floor(random() * DECOY_CITIES.length), DECOY_CITIES.length - 1)];
  return { ...city, latitudeDelta: 0.06, longitudeDelta: 0.06 };
}

/**
 * Link that opens the place in Apple Plans (the phone's own maps app) — to
 * get there, not just to see where it is. `ll` centres on the coordinates,
 * `q` names the pin.
 */
export function mapsUrl(location: Pick<LocationDto, "name" | "lat" | "lng">): string {
  return `http://maps.apple.com/?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}`;
}
