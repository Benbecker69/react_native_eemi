import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { StatusPill } from "@/components/StatusPill";
import { formatCredits, formatDistance } from "@/utils/format";
import type { NearbySpace } from "@/types/api";

type SpaceCardProps = { item: NearbySpace; onPress: () => void };

// One bookable space in a list: what it is, where, what it costs, and whether
// it is free right now. Tapping it opens its page to pick a day and hours.
export function SpaceCard({ item, onPress }: SpaceCardProps) {
  const colors = useColors();
  const { space, location } = item;
  const tone = item.busy ? colors.inkMuted : colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
          {space.name}
        </Text>
        {item.distanceM !== null ? (
          <Text style={{ color: colors.accent, fontWeight: "700" }}>{formatDistance(item.distanceM)}</Text>
        ) : null}
      </View>

      <Text style={{ color: colors.inkMuted }} numberOfLines={1}>
        {location.name} · {location.city}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={{ color: colors.inkMuted, flexShrink: 1 }}>
          {space.capacity} place{space.capacity === 1 ? "" : "s"} · {formatCredits(space.pricePerHour)}/h
        </Text>
        <StatusPill tone={tone} label={item.busy ? "Occupé maintenant" : "Libre maintenant"} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 17, fontWeight: "700" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
});
