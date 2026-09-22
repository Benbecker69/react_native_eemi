import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";

// Placeholder for Phase 3 — the real list (upcoming/past, cancel) is built in
// Phase 4/5.
export default function ReservationsScreen() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>Réservations</Text>
        <Text style={{ color: colors.inkMuted }}>À venir : vos réservations à venir et passées.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 8, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
});
