import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { StatusPill } from "@/components/StatusPill";
import { reservationPhase, reservationStatusInfo } from "@/features/reservations/rules";
import { formatCreditsSpent, formatHourRange } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

type ReservationRowProps = { item: ReservationDto; now: Date; onPress: () => void };

// One reservation inside a day section of the "Mes réservations" list — the
// day itself is the section header, so this only needs the hour range, not
// the full date again. `now` decides Confirmée vs Terminée (the server never
// flips a reservation's stored status once its slot is over — see `rules.ts`).
export function ReservationRow({ item, now, onPress }: ReservationRowProps) {
  const colors = useColors();
  const status = reservationStatusInfo(reservationPhase(item, now), colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.text}>
        <View style={styles.topLine}>
          <Text style={[styles.hours, { color: colors.ink }]}>{formatHourRange(item.startAt, item.endAt)}</Text>
          <StatusPill tone={status.tone} label={status.label} />
        </View>
        <Text style={{ color: colors.inkMuted }} numberOfLines={1}>
          {item.space.name} · {item.location.name}
        </Text>
      </View>

      <Text style={[styles.credits, status.creditsStyle]}>{formatCreditsSpent(item.creditsSpent)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  text: { flex: 1, gap: 6 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  hours: { fontSize: 16, fontFamily: "Fraunces_500Medium" },
  credits: { fontSize: 13, fontWeight: "700" },
});
