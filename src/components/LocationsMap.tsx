import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useColors } from "@/theme/colors";
import { MapAccessGate } from "@/components/MapAccessGate";
import { regionFor, type LocationPin } from "@/features/spaces/map";

type LocationsMapProps = {
  pins: LocationPin[];
  /** The place currently chosen, highlighted; `null` when none is. */
  selectedId: string | null;
  onSelect: (locationId: string) => void;
  /** Lets go of the chosen place: every space is listed again. */
  onClear: () => void;
  height?: number;
};

// Every place the user can book in, on one map: tap a pin to see only that
// place's spaces. Shown only when the location is on (`MapAccessGate`); the
// line under it says what a tap does, or which place is chosen. The region
// is computed once from the pins (`regionFor`) — the map is only mounted when
// there are pins, so `initialRegion` is right. Apple Plans through Expo Go:
// no API key, no configuration.
export function LocationsMap({ pins, selectedId, onSelect, onClear, height = 220 }: LocationsMapProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const region = regionFor(pins.map((pin) => pin.location));
  if (!region) return null;

  const selected = pins.find((pin) => pin.location.id === selectedId) ?? null;

  return (
    <View style={styles.block}>
      <MapAccessGate height={height}>
        <View
          accessible={false}
          style={[styles.frame, { height, borderColor: colors.border }]}
          accessibilityLabel={`Carte des ${pins.length} lieux`}
        >
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            userInterfaceStyle={scheme === "dark" ? "dark" : "light"}
            // A booking map is for choosing a place, not for navigating: no
            // tilt, no rotation to get lost in.
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {pins.map((pin) => (
              <Marker
                key={pin.location.id}
                coordinate={{ latitude: pin.location.lat, longitude: pin.location.lng }}
                title={pin.location.name}
                description={`${pin.freeCount} libre${pin.freeCount === 1 ? "" : "s"} sur ${pin.spaceCount}`}
                // The chosen place is the brand color, the others a quiet gray.
                pinColor={pin.location.id === selectedId ? colors.accent : colors.inkMuted}
                onPress={() => onSelect(pin.location.id)}
              />
            ))}
          </MapView>
        </View>

        {selected ? (
          <View style={styles.caption}>
            <Text style={[styles.captionText, { color: colors.ink }]} numberOfLines={1}>
              {selected.location.name} · {selected.spaceCount} espace{selected.spaceCount === 1 ? "" : "s"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClear}
              style={({ pressed }) => [styles.clear, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Tous les lieux</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
            Touchez un repère pour ne voir que les espaces de ce lieu.
          </Text>
        )}
      </MapAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  frame: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  caption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  captionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  clear: { minHeight: 44, justifyContent: "center" },
});
