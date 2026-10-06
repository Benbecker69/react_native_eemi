import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { BOOKABLE_HOURS, endHoursFor } from "@/features/booking/slots";
import { MonthCalendar } from "@/components/MonthCalendar";
import { HourGridSkeleton } from "@/components/skeletons";

type SlotPickerProps = {
  date: Date;
  minDate: Date;
  maxDate: Date;
  onSelectDate: (date: Date) => void;
  startHour: number | null;
  endHour: number | null;
  isStartDisabled: (hour: number) => boolean;
  isEndDisabled: (hour: number) => boolean;
  onSelectStart: (hour: number) => void;
  onSelectEnd: (hour: number) => void;
  /** The day's busy slots are still loading: hour grids show placeholders. */
  loading: boolean;
};

// Month calendar, then a start hour and an end hour, so a booking can span
// several hours ("14h to 17h"). Shared by "pick a space's slot" (`space/[id]`)
// and "Réserver selon ma position" (`reserve`) so both offer the same picker
// and the same rules. Presentational only: which hours are disabled is
// decided by the screen through `features/booking/slots.ts`.
export function SlotPicker({
  date,
  minDate,
  maxDate,
  onSelectDate,
  startHour,
  endHour,
  isStartDisabled,
  isEndDisabled,
  onSelectStart,
  onSelectEnd,
  loading,
}: SlotPickerProps) {
  const colors = useColors();
  const dayFull = !loading && BOOKABLE_HOURS.every(isStartDisabled);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Jour</Text>
        <MonthCalendar selected={date} minDate={minDate} maxDate={maxDate} onSelect={onSelectDate} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Début</Text>
        {loading ? (
          <HourGridSkeleton />
        ) : (
          <HourGrid
            hours={BOOKABLE_HOURS}
            selected={startHour}
            isDisabled={isStartDisabled}
            onSelect={onSelectStart}
          />
        )}
        <Text style={{ color: dayFull ? colors.danger : colors.inkMuted, fontSize: 13 }}>
          {dayFull
            ? "Plus aucun créneau libre ce jour-là : choisissez un autre jour."
            : "Heures grisées : déjà réservées ou déjà commencées."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Fin</Text>
        {startHour === null ? (
          <Text style={{ color: colors.inkMuted }}>Choisissez d’abord l’heure de début.</Text>
        ) : (
          <HourGrid
            hours={endHoursFor(startHour)}
            selected={endHour}
            isDisabled={isEndDisabled}
            onSelect={onSelectEnd}
          />
        )}
      </View>
    </View>
  );
}

function HourGrid({
  hours,
  selected,
  isDisabled,
  onSelect,
}: {
  hours: number[];
  selected: number | null;
  isDisabled: (hour: number) => boolean;
  onSelect: (hour: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.hourGrid}>
      {hours.map((hour) => {
        const disabled = isDisabled(hour);
        const active = selected === hour;
        return (
          <Pressable
            key={hour}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            disabled={disabled}
            onPress={() => onSelect(hour)}
            style={({ pressed }) => [
              styles.hourChip,
              {
                backgroundColor: active ? colors.accent : colors.surface,
                borderColor: colors.border,
                opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: active ? colors.accentText : colors.ink, fontWeight: "600" }}>{hour}h</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  hourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hourChip: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
