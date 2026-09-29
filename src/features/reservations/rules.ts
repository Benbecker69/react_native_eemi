import type { Colors } from "@/theme/colors";
import type { ReservationDto } from "@/types/api";

export type ReservationPhase = "upcoming" | "past" | "cancelled";

/**
 * How a reservation reads right now, matching how the app's own tabs split
 * them (`GET /reservations?scope=upcoming|past`, both keyed on `endAt`):
 * "cancelled" always wins, otherwise "past" once it has fully ENDED — not
 * merely started, a reservation currently in progress still reads (and
 * displays) as "upcoming"/active — "upcoming" until then.
 */
export function reservationPhase(reservation: ReservationDto, now: Date): ReservationPhase {
  if (reservation.status === "cancelled") return "cancelled";
  return new Date(reservation.endAt).getTime() > now.getTime() ? "upcoming" : "past";
}

/**
 * Cancellable exactly when the server would still accept it: the API refuses
 * `ALREADY_STARTED` once `startAt` has passed — not `endAt`, a reservation
 * already in progress is already too late to cancel, even though it still
 * reads as "upcoming" everywhere else. That's a different, narrower cutoff
 * than `reservationPhase`, so this checks it directly rather than through it.
 */
export function canCancelReservation(reservation: ReservationDto, now: Date): boolean {
  if (reservation.status !== "confirmed") return false;
  return new Date(reservation.startAt).getTime() > now.getTime();
}

/**
 * How a reservation's phase reads across the app: the dot/pill color, its
 * label, and how its cost is shown. A cancelled booking was refunded, so its
 * cost is crossed out rather than colored like money still spent.
 */
export function reservationStatusInfo(phase: ReservationPhase, colors: Colors) {
  switch (phase) {
    case "upcoming":
      return { tone: colors.accent, label: "Confirmée", creditsStyle: { color: colors.danger } };
    case "cancelled":
      return {
        tone: colors.danger,
        label: "Annulée",
        creditsStyle: { color: colors.inkMuted, textDecorationLine: "line-through" as const },
      };
    default:
      return { tone: colors.inkMuted, label: "Terminée", creditsStyle: { color: colors.inkMuted } };
  }
}
