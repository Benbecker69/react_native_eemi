import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { formatDayLong, formatDayParts, formatHourRange } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

type UpcomingListProps = { items: ReservationDto[]; onPress: (item: ReservationDto) => void };

// The few bookings after the next one, on the home screen: one grouped sheet
// with hairlines between rows (a short, fixed number of rows — the full,
// paginated list lives in the Réserver tab). Each row leads with a small
// calendar tile, since here — unlike in a day-grouped list — the day is the
// first thing to read.
export function UpcomingList({ items, onPress }: UpcomingListProps) {
  const colors = useColors();
  return (
    <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {items.map((item, index) => {
        const start = new Date(item.startAt);
        const parts = formatDayParts(start);
        const hours = formatHourRange(item.startAt, item.endAt);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${formatDayLong(start)}, ${hours}, ${item.space.name}, ${item.location.name}`}
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.row,
              index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border } : null,
              pressed ? { backgroundColor: `${colors.ink}0d` } : null,
            ]}
          >
            <View style={[styles.tile, { backgroundColor: colors.background }]}>
              <Text style={[styles.tileSmall, { color: colors.inkMuted }]}>{parts.weekday}</Text>
              <Text style={[styles.tileDay, { color: colors.ink }]}>{parts.day}</Text>
              <Text style={[styles.tileSmall, { color: colors.inkMuted }]}>{parts.month}</Text>
            </View>
            <View style={styles.text}>
              <Text style={[styles.hours, { color: colors.ink }]}>{hours}</Text>
              <Text style={{ color: colors.inkMuted }} numberOfLines={1}>
                {item.space.name} · {item.location.name}
              </Text>
            </View>
            <SymbolView name="chevron.right" tintColor={colors.inkMuted} size={14} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  tile: { width: 52, borderRadius: 10, paddingVertical: 6, alignItems: "center" },
  tileSmall: { fontSize: 11, fontWeight: "600" },
  tileDay: { fontSize: 20, lineHeight: 24, fontFamily: "Fraunces_600SemiBold" },
  text: { flex: 1, gap: 4 },
  hours: { fontSize: 16, fontFamily: "Fraunces_500Medium" },
});
