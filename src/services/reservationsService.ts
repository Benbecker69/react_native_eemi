import type { Page, ReservationDto } from "@/types/api";
import { apiFetch } from "./api";

// Business intents, not URLs — see the `backend-api-client` skill.

export type ReservationsScope = "upcoming" | "past" | "all";

/** Both create and cancel return the fresh credit balance — use it to update the cache instead of guessing. */
export type ReservationMutationResult = { reservation: ReservationDto; credits: number };

export function listReservations(input: {
  scope: ReservationsScope;
  cursor?: string | null;
  limit?: number;
}): Promise<Page<ReservationDto>> {
  const params = new URLSearchParams({ scope: input.scope });
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.limit) params.set("limit", String(input.limit));
  return apiFetch<Page<ReservationDto>>(`/reservations?${params.toString()}`);
}

export async function getReservation(id: string): Promise<ReservationDto> {
  const { reservation } = await apiFetch<{ reservation: ReservationDto }>(`/reservations/${id}`);
  return reservation;
}

/** Slot: 30 min–12 h, starting now (5 min tolerance) or later — see docs/api-mobile.md "Règles métier". */
export function createReservation(input: {
  spaceId: string;
  startAt: string;
  endAt: string;
}): Promise<ReservationMutationResult> {
  return apiFetch<ReservationMutationResult>("/reservations", { method: "POST", body: input });
}

export function cancelReservation(id: string): Promise<ReservationMutationResult> {
  return apiFetch<ReservationMutationResult>(`/reservations/${id}/cancel`, { method: "POST" });
}
