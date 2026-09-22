import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";

// Placeholder for Phase 3 — the real check-in history (accepted and refused
// attempts) is built in Phase 5.
export default function HistoryScreen() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>Historique</Text>
        <Text style={{ color: colors.inkMuted }}>
          À venir : l’historique de vos arrivées (check-in).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 8, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
});
