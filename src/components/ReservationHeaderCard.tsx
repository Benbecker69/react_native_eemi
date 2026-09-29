import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { StatusPill } from "@/components/StatusPill";
import { reservationPhase, reservationStatusInfo } from "@/features/reservations/rules";
import { formatCreditsSpent, formatDayHeading, formatHourRange, spaceTypeLabel } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

type ReservationHeaderCardProps = { reservation: ReservationDto; now: Date };

// The reservation detail screen's own header: same day/hour/cost language as
// `ReservationHero` on the Mes réservations list (opening a reservation feels
// like a continuation of the card just tapped), but phase-aware — only one
// still ahead of us gets the bold accent treatment; a past or cancelled one
// gets a calmer, neutral card instead of the screen keeps insisting "active"
// once there is nothing left to do about it.
export function ReservationHeaderCard({ reservation, now }: ReservationHeaderCardProps) {
  const colors = useColors();
  const phase = reservationPhase(reservation, now);
  const status = reservationStatusInfo(phase, colors);
  const canCheckIn = reservation.checkIn.state === "available";
  const featured = phase === "upcoming";

  const foreground = featured ? colors.accentText : colors.ink;
  const muted = featured ? { color: foreground, opacity: 0.85 } : { color: colors.inkMuted };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: featured ? colors.accent : colors.surface,
          borderWidth: featured ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, muted]}>{spaceTypeLabel(reservation.space.type)}</Text>
        {/* Redundant on the featured card — its own bold treatment already says "active". */}
        {!featured ? <StatusPill tone={status.tone} label={status.label} /> : null}
      </View>

      <Text style={[styles.day, { color: foreground }]}>{formatDayHeading(new Date(reservation.startAt))}</Text>
      <Text style={[styles.hours, { color: foreground }]}>
        {formatHourRange(reservation.startAt, reservation.endAt)}
      </Text>
      <Text style={muted} numberOfLines={1}>
        {reservation.space.name} · {reservation.location.name}
      </Text>
      <Text style={muted} numberOfLines={1}>
        {reservation.location.address}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={[styles.cost, featured ? { color: foreground, opacity: 0.9 } : status.creditsStyle]}>
          {formatCreditsSpent(reservation.creditsSpent)}
        </Text>
        {canCheckIn ? (
          <View
            style={[
              styles.pill,
              { backgroundColor: featured ? `${colors.accentText}26` : `${colors.accent}1f` },
            ]}
          >
            <Text style={{ color: featured ? colors.accentText : colors.accent, fontSize: 12, fontWeight: "700" }}>
              Arrivée disponible
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  eyebrow: { fontSize: 13, fontWeight: "600" },
  day: { fontSize: 17, fontWeight: "700", marginTop: 6 },
  hours: { fontSize: 26, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 },
  cost: { fontSize: 15, fontWeight: "700" },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
