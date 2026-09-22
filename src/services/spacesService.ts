import type { NearbyResult } from "@/types/api";
import { apiFetch } from "./api";

// Business intent, not a URL — see the `backend-api-client` skill.
// `GET /spaces/nearby` works without lat/lng too (alphabetical order,
// `hasPosition: false`): that's the fallback when location is refused, not
// an error — see docs/api-mobile.md.
export function listNearbySpaces(input: {
  lat?: number;
  lng?: number;
  startAt?: string;
  endAt?: string;
  limit?: number;
}): Promise<NearbyResult> {
  const params = new URLSearchParams();
  if (input.lat !== undefined) params.set("lat", String(input.lat));
  if (input.lng !== undefined) params.set("lng", String(input.lng));
  if (input.startAt) params.set("startAt", input.startAt);
  if (input.endAt) params.set("endAt", input.endAt);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiFetch<NearbyResult>(`/spaces/nearby${query ? `?${query}` : ""}`);
}
