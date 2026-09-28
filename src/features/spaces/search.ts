import type { NearbySpace } from "@/types/api";

// Search by name runs on the list already in memory (30 spaces at most, the
// server's cap): instant, works offline, and costs no request per keystroke
// on the tunnel's free quota. Pure and unit-tested — a matching rule never
// lives inside a component.

/** Lower-case, accent-free, trimmed: "Salle Ampère " → "salle ampere". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Keeps the spaces whose name, place or city contains every word typed
 * ("salle chantier" finds "Salle Ampère" at "Le Chantier"). An empty query
 * keeps everything.
 */
export function filterSpaces(items: NearbySpace[], query: string): NearbySpace[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const haystack = normalizeText(`${item.space.name} ${item.location.name} ${item.location.city}`);
    return words.every((word) => haystack.includes(word));
  });
}
