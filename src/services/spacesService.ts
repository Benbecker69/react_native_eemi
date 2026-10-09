import type { NearbyResult, SpaceAvailability } from "@/types/api";
import { apiFetch } from "./api";

// Business intent, not a URL.
// `GET /spaces/nearby` works without lat/lng too (alphabetical order,
// `hasPosition: false`): that's the fallback when location is refused, not
// an error — see docs/api-mobile.md.
export function listNearbySpaces(input: {
  lat?: number;
  lng?: number;
  startAt?: string;
  endAt?: string;
  limit?: number;
  /** Keep the spaces already taken on the slot in the list (flagged `busy`). */
  includeBusy?: boolean;
}): Promise<NearbyResult> {
  const params = new URLSearchParams();
  if (input.lat !== undefined) params.set("lat", String(input.lat));
  if (input.lng !== undefined) params.set("lng", String(input.lng));
  if (input.startAt) params.set("startAt", input.startAt);
  if (input.endAt) params.set("endAt", input.endAt);
  if (input.limit) params.set("limit", String(input.limit));
  if (input.includeBusy) params.set("includeBusy", "true");
  const query = params.toString();
  return apiFetch<NearbyResult>(`/spaces/nearby${query ? `?${query}` : ""}`);
}

/** Backs the "pick a specific space and slot" screen. Default range: now → +7 days. */
export function getSpaceAvailability(
  spaceId: string,
  input: { from?: string; to?: string } = {},
): Promise<SpaceAvailability> {
  const params = new URLSearchParams();
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const query = params.toString();
  return apiFetch<SpaceAvailability>(`/spaces/${spaceId}/availability${query ? `?${query}` : ""}`);
}
