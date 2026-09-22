import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";

// Placeholder for Phase 3 (routing skeleton only) — the real "espace le plus
// proche + réserver selon ma position" flow is built in Phase 4/5.
export default function NearbyScreen() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>Autour de moi</Text>
        <Text style={{ color: colors.inkMuted }}>À venir : espaces triés par distance.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 8, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
});
