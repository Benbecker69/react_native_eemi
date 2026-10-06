import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import MapView from "react-native-maps";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { randomDecoyRegion } from "@/features/spaces/map";
import type { LocationPermission } from "@/features/location/useLocationPermission";

type LockedMapProps = { height: number; access: LocationPermission };

// What the map looks like while the location is off: a grayscale map of a
// random city, untouchable, with a message on top saying what to do. It is
// there to show the map exists and why it is hidden — it points at no real
// place, and nothing on it can be tapped.
//
// Gray: `mutedStandard` is Apple's desaturated map style, and the veil on top
// blends with `saturation` against what is under it, which drains the color
// that is left. The veil is slightly see-through on purpose: if a device
// ignored the blend mode, the map would still show through instead of being
// covered by a gray block.
export function LockedMap({ height, access }: LockedMapProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  // Drawn once per appearance: a new random city each time the screen opens.
  const [region] = useState(() => randomDecoyRegion());

  // iOS asks only once: after a refusal the way back is the Settings app.
  const needsSettings = access.permission === "denied" && !access.canAskAgain;
  const message = needsSettings
    ? "La localisation est désactivée. Autorisez-la dans les réglages pour voir la carte."
    : "Activez la localisation pour voir la carte.";

  return (
    <View
      accessible
      accessibilityLabel={message}
      style={[styles.frame, { height, borderColor: colors.border }]}
    >
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        mapType="mutedStandard"
        userInterfaceStyle={scheme === "dark" ? "dark" : "light"}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.veil]} />

      <View style={styles.content}>
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SymbolView name="location.slash.fill" tintColor={colors.inkMuted} size={20} />
          <Text style={[styles.message, { color: colors.ink }]}>{message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (needsSettings ? Linking.openSettings() : access.request())}
            disabled={access.isRequesting}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.accent, opacity: pressed || access.isRequesting ? 0.7 : 1 },
            ]}
          >
            {access.isRequesting ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={{ color: colors.accentText, fontWeight: "700" }}>
                {needsSettings ? "Ouvrir les réglages" : "Activer la localisation"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // `isolation`: the blend below mixes with the map only, not with the screen.
  frame: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", isolation: "isolate" },
  veil: { backgroundColor: "rgba(128,128,128,0.9)", mixBlendMode: "saturation" },
  content: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 12 },
  panel: {
    alignItems: "center",
    gap: 8,
    maxWidth: 320,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  message: { fontSize: 14, lineHeight: 19, textAlign: "center" },
  button: {
    minHeight: 44,
    alignSelf: "stretch",
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
