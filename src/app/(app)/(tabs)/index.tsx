import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ApiError } from "@/services/ApiError";
import { listNearbySpaces } from "@/services/spacesService";
import { formatCredits, formatDistance } from "@/utils/format";
import { useForegroundLocation, type ForegroundLocation } from "@/features/location/useForegroundLocation";
import type { NearbySpace } from "@/types/api";

// Read-only in Phase 4 (« Lecture ») — the "Réserver selon ma position"
// mutation (proposal → confirmation) is Phase 5, see `.claude/PLAN.md`.
export default function NearbyScreen() {
  const colors = useColors();
  const location = useForegroundLocation();

  const query = useQuery({
    queryKey: ["nearby", location.coords?.lat ?? null, location.coords?.lng ?? null],
    queryFn: () =>
      listNearbySpaces(location.coords ? { lat: location.coords.lat, lng: location.coords.lng } : {}),
  });

  const items = query.data?.items ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.space.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.ink }]}>Autour de moi</Text>
            <LocationNotice location={location} />
            {query.isPending ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
            {query.isError ? (
              <ScreenState
                tone="danger"
                message={
                  query.error instanceof ApiError ? query.error.message : "Impossible de charger les espaces."
                }
                onRetry={() => query.refetch()}
              />
            ) : null}
            {query.isSuccess && items.length === 0 ? (
              <ScreenState message="Aucun espace disponible pour le moment." />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <NearbySpaceRow item={item} />}
        refreshing={query.isFetching && !query.isPending}
        onRefresh={() => query.refetch()}
      />
    </SafeAreaView>
  );
}

function LocationNotice({ location }: { location: ForegroundLocation }) {
  const colors = useColors();

  // Still resolving the very first silent permission check: render nothing
  // rather than flash an "Autoriser" invite that an already-granted status
  // would immediately replace.
  if (location.permission === "unknown") return null;
  // Already granted and a position was read: nothing to show.
  if (location.permission === "granted" && location.coords) return null;

  let text: string;
  let actionLabel: string | null = null;
  let showSettings = false;

  if (location.permission === "denied") {
    text = "Localisation refusée — espaces triés par ordre alphabétique.";
    showSettings = !location.canAskAgain;
    actionLabel = location.canAskAgain ? "Autoriser la localisation" : null;
  } else if (location.permission === "granted") {
    text = location.isLocating
      ? "Localisation de votre position…"
      : (location.positionError ?? "Position indisponible pour le moment.");
    actionLabel = location.isLocating ? null : "Réessayer";
  } else {
    text = "Autorisez la localisation pour voir les espaces les plus proches de vous.";
    actionLabel = "Autoriser la localisation";
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ color: colors.ink }}>{text}</Text>
      <View style={styles.cardActions}>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => location.request()}
            disabled={location.isLocating}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.accent, opacity: pressed || location.isLocating ? 0.7 : 1 },
            ]}
          >
            {location.isLocating ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={{ color: colors.accentText, fontWeight: "600" }}>{actionLabel}</Text>
            )}
          </Pressable>
        ) : null}
        {showSettings ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openSettings()}
            style={({ pressed }) => [styles.linkButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={{ color: colors.accent, fontWeight: "600" }}>Ouvrir les réglages</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function NearbySpaceRow({ item }: { item: NearbySpace }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.space.name}</Text>
        <Text style={{ color: colors.inkMuted }}>{item.location.name}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={{ color: colors.ink, fontWeight: "600" }}>{formatDistance(item.distanceM)}</Text>
        <Text style={{ color: colors.inkMuted }}>{formatCredits(item.estimatedCredits)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { gap: 12, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  spinner: { alignSelf: "flex-start" },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkButton: { minHeight: 44, justifyContent: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowMeta: { alignItems: "flex-end", gap: 2 },
});
