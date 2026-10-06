import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { useColors } from "@/theme/colors";

export type QuickAction = { icon: SFSymbol; label: string; onPress: () => void };

// The home screen's shortcuts: a round tinted icon over a short label, side
// by side — deliberately not boxed in cards, so they read as actions rather
// than as more content next to the reservation card and the figures.
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={[styles.icon, { backgroundColor: `${colors.accent}1f` }]}>
            <SymbolView name={action.icon} tintColor={colors.accent} size={22} />
          </View>
          <Text style={[styles.label, { color: colors.ink }]} numberOfLines={2}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  action: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 4 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});
