import { StyleSheet, Text, View } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";

// A static top strip, not a toast: it has to stay visible for as long as the
// connection is down. Mounted once in `(app)/_layout.tsx`, above the tab
// navigator, so every screen gets it without repeating the wiring — see
// `expo-best-practices`, "show cached data first and flag it as possibly
// stale". `isConnected === false` only (not `isInternetReachable`, which
// stays `null` while still probing and would flicker the banner on every
// screen open).
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (isConnected !== false) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderColor: colors.border, paddingTop: insets.top + 8 },
      ]}
    >
      <Text style={[styles.text, { color: colors.danger }]}>
        Hors ligne — les données affichées peuvent être obsolètes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: { fontSize: 13, fontWeight: "600" },
});
