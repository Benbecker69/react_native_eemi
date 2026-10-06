import type { CheckInDto, CheckInHistoryDto, Page } from "@/types/api";
import { apiFetch } from "./api";

// Business intent, not a URL — see the `backend-api-client` skill.
// Read-only history (every attempt, accepted or refused — see docs/api-mobile.md).
export function listCheckIns(
  input: { cursor?: string | null; limit?: number } = {},
): Promise<Page<CheckInHistoryDto>> {
  const params = new URLSearchParams();
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiFetch<Page<CheckInHistoryDto>>(`/check-ins${query ? `?${query}` : ""}`);
}

/**
 * A refused attempt is still a normal `201` — read `checkIn.accepted` and
 * `checkIn.reason`, never treat it as a thrown error (see docs/api-mobile.md
 * "Check-in"). `ALREADY_CHECKED_IN` (409) is the one case that IS a thrown
 * `ApiError`, since no attempt row is written for it.
 */
export function createCheckIn(
  reservationId: string,
  input: {
    lat: number;
    lng: number;
    accuracyM: number;
    capturedAt: string;
    // The space id read from a scanned QR code — optional, see `features/checkins/qr.ts`.
    scannedSpaceId?: string;
  },
): Promise<{ checkIn: CheckInDto; radiusM: number }> {
  return apiFetch<{ checkIn: CheckInDto; radiusM: number }>(
    `/reservations/${reservationId}/check-in`,
    { method: "POST", body: input },
  );
}
