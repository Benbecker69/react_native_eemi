import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";

// Placeholder for Phase 3 (dynamic route wired, no content yet) — the real
// detail (space, location, check-in, cancel) is built in Phase 4/5.
export default function ReservationDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={{ color: colors.inkMuted }}>À venir : détail de la réservation {id}.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center" },
});
