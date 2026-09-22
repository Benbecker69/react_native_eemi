import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";

type ScreenStateProps = {
  message: string;
  tone?: "muted" | "danger";
  onRetry?: () => void;
  retryLabel?: string;
};

// The empty/error placeholder shared by every data screen — see
// `mobile-design`, "Every data screen has four states". Loading is shown
// with `ActivityIndicator` directly where it's needed; this only covers the
// other two so they don't drift into slightly different implementations.
export function ScreenState({ message, tone = "muted", onRetry, retryLabel = "Réessayer" }: ScreenStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: tone === "danger" ? colors.danger : colors.inkMuted }]}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.accent, fontWeight: "600" }}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16, gap: 8, alignItems: "flex-start" },
  message: { fontSize: 15, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: "center" },
});
