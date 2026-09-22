import type { CheckInHistoryDto, Page } from "@/types/api";
import { apiFetch } from "./api";

// Business intent, not a URL — see the `backend-api-client` skill.
// The check-in mutation itself lands in Phase 5; this is the read-only
// history (every attempt, accepted or refused — see docs/api-mobile.md).
export function listCheckIns(
  input: { cursor?: string | null; limit?: number } = {},
): Promise<Page<CheckInHistoryDto>> {
  const params = new URLSearchParams();
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiFetch<Page<CheckInHistoryDto>>(`/check-ins${query ? `?${query}` : ""}`);
}
