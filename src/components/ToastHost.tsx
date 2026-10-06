import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { useToast } from "@/features/feedback/ToastContext";

// Mounted once at the true root (`app/_layout.tsx`), above the navigation
// stack — a toast fired right before a `router.replace()` (the common case:
// booking, cancelling, check-in, logging in all navigate right after their
// mutation succeeds) survives that transition, and a toast fired from any
// screen, (auth) included, always has somewhere to render.
export function ToastHost() {
  const { toast, dismiss } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-80));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!toast) return;
    translateY.setValue(-80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [toast, translateY, opacity]);

  if (!toast) return null;

  const tone = toast.tone === "error" ? colors.danger : colors.accent;
  const icon = toast.tone === "error" ? "xmark.circle.fill" : "checkmark.circle.fill";

  function handleDismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => dismiss());
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { top: insets.top + 8 }]}>
      <Animated.View style={[styles.animatedWrap, { transform: [{ translateY }], opacity }]}>
        <Pressable
          accessibilityRole="alert"
          onPress={handleDismiss}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <SymbolView name={icon} tintColor={tone} size={20} />
          <Text style={[styles.message, { color: colors.ink }]} numberOfLines={3}>
            {toast.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 1000 },
  animatedWrap: { maxWidth: 440, width: "92%" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { flex: 1, fontSize: 14, fontWeight: "600" },
});
