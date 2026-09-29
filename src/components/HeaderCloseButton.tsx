import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/theme/colors";

// A modal has no back arrow: this gives it a visible way out besides the swipe.
export function HeaderCloseButton() {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fermer"
      onPress={() => router.back()}
      style={({ pressed }) => ({ minHeight: 44, minWidth: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ color: colors.accent, fontSize: 17 }}>Fermer</Text>
    </Pressable>
  );
}
