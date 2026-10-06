import { Linking, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { MapAccessGate } from "@/components/MapAccessGate";
import { mapsUrl, regionFor } from "@/features/spaces/map";
import type { LocationDto } from "@/types/api";

type SpaceLocationMapProps = { location: LocationDto; height?: number };

// Where the space being booked is: its place on a map, its address, and a
// button that opens the phone's own maps app to get there. Shown on every
// screen that books a single space, so the user knows where they are going
// before they confirm. Only the map itself waits for the location to be on
// (`MapAccessGate`): the address and the route button are plain information
// and stay.
export function SpaceLocationMap({ location, height = 180 }: SpaceLocationMapProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const region = regionFor([location]);
  if (!region) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MapAccessGate height={height}>
        <View style={[styles.map, { height }]} accessibilityLabel={`Carte : ${location.name}`}>
          <MapView
            // `key`: a different place gets a fresh map framed on it.
            key={location.id}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            userInterfaceStyle={scheme === "dark" ? "dark" : "light"}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              title={location.name}
              pinColor={colors.accent}
            />
          </MapView>
        </View>
      </MapAccessGate>

      <View style={styles.footer}>
        <View style={styles.address}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={{ color: colors.inkMuted }} numberOfLines={2}>
            {location.address}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ouvrir ${location.name} dans Plans`}
          onPress={() => Linking.openURL(mapsUrl(location))}
          style={({ pressed }) => [
            styles.route,
            { borderColor: colors.accent, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <SymbolView name="arrow.triangle.turn.up.right.diamond" tintColor={colors.accent} size={16} />
          <Text style={{ color: colors.accent, fontWeight: "600" }}>Itinéraire</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: "hidden" },
  map: { width: "100%" },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  address: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
});
