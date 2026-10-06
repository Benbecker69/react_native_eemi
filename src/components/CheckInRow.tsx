import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { StatusPill } from "@/components/StatusPill";
import { checkInReasonLabel, formatDistance, formatTime } from "@/utils/format";
import type { CheckInHistoryDto } from "@/types/api";

// One check-in attempt inside a day section of the Historique list — the day
// itself is the section header, so this only needs the hour it was tried at.
// Tappable: opens the full detail (precision, distance, the slot it was
// tried against).
export function CheckInRow({ item, onPress }: { item: CheckInHistoryDto; onPress: () => void }) {
  const colors = useColors();
  const tone = item.accepted ? colors.accent : colors.danger;
  const label = item.accepted ? "Arrivée validée" : checkInReasonLabel(item.reason);

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
          <Text style={[styles.time, { color: colors.ink }]}>{formatTime(item.createdAt)}</Text>
          <StatusPill tone={tone} label={label} />
        </View>
        <Text style={{ color: colors.inkMuted }} numberOfLines={1}>
          {item.reservation.space.name} · {item.reservation.location.name}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={{ color: colors.inkMuted }}>{formatDistance(item.distanceM)}</Text>
        <SymbolView name="chevron.right" tintColor={colors.inkMuted} size={13} />
      </View>
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
  time: { fontSize: 16, fontFamily: "Fraunces_500Medium" },
  meta: { alignItems: "flex-end", gap: 4 },
});
