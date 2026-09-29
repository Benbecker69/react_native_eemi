import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { formatCreditsSpent, formatDayHeading, formatHourRange } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

type ReservationHeroProps = { item: ReservationDto; onPress: () => void };

// The next confirmed reservation, featured above the day-grouped list — only
// shown for the "À venir" scope, the only one whose ascending order
// guarantees this really is the nearest one. Same accent-filled language as
// the "Réserver près de moi" card on the Espaces pane, so the two primary
// cards of this screen read as one family rather than two different styles.
export function ReservationHero({ item, onPress }: ReservationHeroProps) {
  const colors = useColors();
  const canCheckIn = item.checkIn.state === "available";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Prochaine réservation : ${item.space.name}, ${formatDayHeading(new Date(item.startAt))}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }]}
    >
      <Text style={[styles.eyebrow, { color: colors.accentText }]}>Prochaine réservation</Text>
      <Text style={[styles.day, { color: colors.accentText }]}>{formatDayHeading(new Date(item.startAt))}</Text>
      <Text style={[styles.hours, { color: colors.accentText }]}>{formatHourRange(item.startAt, item.endAt)}</Text>
      <Text style={{ color: colors.accentText, opacity: 0.9 }} numberOfLines={1}>
        {item.space.name} · {item.location.name}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={{ color: colors.accentText, opacity: 0.9, fontWeight: "600" }}>
          {formatCreditsSpent(item.creditsSpent)}
        </Text>
        {canCheckIn ? (
          <View style={[styles.pill, { backgroundColor: `${colors.accentText}26` }]}>
            <Text style={{ color: colors.accentText, fontSize: 12, fontWeight: "700" }}>Arrivée disponible</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, gap: 4 },
  eyebrow: { fontSize: 13, fontWeight: "600", opacity: 0.85 },
  day: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  hours: { fontSize: 26, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
