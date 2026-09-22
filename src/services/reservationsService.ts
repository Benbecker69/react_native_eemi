import type { Page, ReservationDto } from "@/types/api";
import { apiFetch } from "./api";

// Business intents, not URLs — see the `backend-api-client` skill.
// Mutations (create/cancel) land in Phase 5; this file is read-only for now.

export type ReservationsScope = "upcoming" | "past" | "all";

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
