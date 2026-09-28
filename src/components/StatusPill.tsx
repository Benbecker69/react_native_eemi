import { StyleSheet, Text, View } from "react-native";

type StatusPillProps = { tone: string; label: string };

// A colored dot + label: how this app marks a state at a glance — a space
// free or busy right now (`SpaceCard`), a reservation confirmed, cancelled or
// completed (`ReservationRow`, `ReservationHero`). One shared look so every
// status reads the same way across the app.
export function StatusPill({ tone, label }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: `${tone}1f` }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={{ color: tone, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
