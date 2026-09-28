import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import {
  addMonths,
  buildMonthGrid,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "@/features/booking/calendar";
import { formatDayLong, formatMonthTitle } from "@/utils/format";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"]; // Monday first

type MonthCalendarProps = {
  selected: Date;
  /** First selectable day (today). Earlier days are greyed out. */
  minDate: Date;
  /** Last selectable day. Later days are greyed out and the month arrows stop here. */
  maxDate: Date;
  onSelect: (date: Date) => void;
};

// A real month view: arrows to change month, days you can tap, today ringed,
// past days and days beyond the booking horizon greyed out. Presentational —
// the month grid and date math live in `features/booking/calendar.ts`.
export function MonthCalendar({ selected, minDate, maxDate, onSelect }: MonthCalendarProps) {
  const colors = useColors();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selected));

  const weeks = buildMonthGrid(visibleMonth);
  const canGoPrevious = visibleMonth.getTime() > startOfMonth(minDate).getTime();
  const canGoNext = visibleMonth.getTime() < startOfMonth(maxDate).getTime();
  const firstSelectable = startOfDay(minDate).getTime();
  const lastSelectable = maxDate.getTime();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <NavButton
          label="‹"
          accessibilityLabel="Mois précédent"
          disabled={!canGoPrevious}
          onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
        />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          {formatMonthTitle(visibleMonth)}
        </Text>
        <NavButton
          label="›"
          accessibilityLabel="Mois suivant"
          disabled={!canGoNext}
          onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
        />
      </View>

      <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((weekday, index) => (
          <Text key={index} style={[styles.weekday, { color: colors.inkMuted }]}>
            {weekday}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            // Padding before the 1st and after the last day: nothing to draw.
            if (!day) return <View key={dayIndex} style={styles.cell} />;
            const disabled = day.getTime() < firstSelectable || day.getTime() > lastSelectable;
            const active = isSameDay(day, selected);
            const today = isSameDay(day, minDate);
            return (
              <Pressable
                key={dayIndex}
                accessibilityRole="button"
                accessibilityLabel={formatDayLong(day)}
                accessibilityState={{ selected: active, disabled }}
                disabled={disabled}
                onPress={() => onSelect(day)}
                style={styles.cell}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: active ? colors.accent : "transparent",
                        // Always an explicit color: a border with none is drawn black.
                        borderColor: today && !active ? colors.accent : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.accentText : disabled ? colors.inkMuted : colors.ink,
                        fontWeight: active ? "700" : "500",
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function NavButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.navButton, { opacity: disabled ? 0.25 : pressed ? 0.6 : 1 }]}
    >
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 8, gap: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 16, fontWeight: "700", textTransform: "capitalize" },
  navButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  week: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", paddingVertical: 4 },
  // The touch target (full cell, 44 pt tall); the visible day is the round bubble inside it.
  cell: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
