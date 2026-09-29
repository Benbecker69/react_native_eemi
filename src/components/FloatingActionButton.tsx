import { Pressable, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";

type FloatingActionButtonProps = { onPress: () => void; accessibilityLabel: string };

// The round "+" pinned bottom-right of a screen: the one primary action
// (new reservation) reachable from anywhere in the list.
export function FloatingActionButton({ onPress, accessibilityLabel }: FloatingActionButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <SymbolView name="plus" tintColor={colors.accentText} size={26} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
