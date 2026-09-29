import type { ReservationDto } from "@/types/api";
import { canCancelReservation, reservationPhase, reservationStatusInfo } from "../rules";

const at = (day: number, hour: number) => new Date(2026, 8, day, hour);

function reservation(status: ReservationDto["status"], startAt: Date, endAt: Date): ReservationDto {
  return {
    id: "r1",
    status,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    creditsSpent: 18,
    createdAt: startAt.toISOString(),
    space: { id: "s1", name: "Salle Ampère", type: "salle-reunion", capacity: 4, pricePerHour: 18 },
    location: { id: "l1", name: "Le Chantier", city: "Lyon", address: "1 rue du Test", lat: 45.7, lng: 4.8 },
    checkIn: { state: "unavailable", opensAt: startAt.toISOString(), closesAt: endAt.toISOString(), doneAt: null },
  };
}

describe("reservationPhase", () => {
  const now = at(28, 12);

  it("is upcoming before a confirmed reservation has started", () => {
    expect(reservationPhase(reservation("confirmed", at(28, 14), at(28, 15)), now)).toBe("upcoming");
  });

  it("is still upcoming while a confirmed reservation is in progress — it has not ENDED yet", () => {
    expect(reservationPhase(reservation("confirmed", at(28, 10), at(28, 13)), now)).toBe("upcoming");
  });

  it("is past once a confirmed reservation has fully ended", () => {
    expect(reservationPhase(reservation("confirmed", at(28, 8), at(28, 11)), now)).toBe("past");
  });

  it("is past exactly at the end instant", () => {
    expect(reservationPhase(reservation("confirmed", at(28, 10), at(28, 12)), now)).toBe("past");
  });

  it("is cancelled regardless of the time, even for a booking still in the future", () => {
    expect(reservationPhase(reservation("cancelled", at(28, 14), at(28, 15)), now)).toBe("cancelled");
  });

  it("only special-cases 'cancelled': a 'completed' status still follows the clock, like 'confirmed'", () => {
    expect(reservationPhase(reservation("completed", at(27, 14), at(27, 15)), now)).toBe("past");
    expect(reservationPhase(reservation("completed", at(29, 14), at(29, 15)), now)).toBe("upcoming");
  });
});

describe("canCancelReservation", () => {
  const now = at(28, 12);

  it("allows cancelling a confirmed reservation that has not started", () => {
    expect(canCancelReservation(reservation("confirmed", at(28, 14), at(28, 15)), now)).toBe(true);
  });

  it("refuses a confirmed reservation that has already started, even if still in progress — the real bug report", () => {
    expect(canCancelReservation(reservation("confirmed", at(28, 10), at(28, 13)), now)).toBe(false);
  });

  it("refuses a confirmed reservation that has fully ended", () => {
    expect(canCancelReservation(reservation("confirmed", at(27, 14), at(27, 15)), now)).toBe(false);
  });

  it("refuses an already-cancelled reservation", () => {
    expect(canCancelReservation(reservation("cancelled", at(29, 14), at(29, 15)), now)).toBe(false);
  });
});

describe("reservationStatusInfo", () => {
  const colors = { accent: "#2d5744", danger: "#b3261e", inkMuted: "#6b6f76" } as Parameters<
    typeof reservationStatusInfo
  >[1];

  it("labels an upcoming (or in-progress) reservation as confirmed, cost still counted as spent", () => {
    const info = reservationStatusInfo("upcoming", colors);
    expect(info.label).toBe("Confirmée");
    expect(info.tone).toBe(colors.accent);
    expect(info.creditsStyle).toEqual({ color: colors.danger });
  });

  it("labels a fully past reservation as finished, not confirmed", () => {
    const info = reservationStatusInfo("past", colors);
    expect(info.label).toBe("Terminée");
    expect(info.tone).toBe(colors.inkMuted);
  });

  it("crosses out a cancelled booking's cost — it was refunded", () => {
    const info = reservationStatusInfo("cancelled", colors);
    expect(info.label).toBe("Annulée");
    expect(info.creditsStyle).toMatchObject({ textDecorationLine: "line-through" });
  });
});
