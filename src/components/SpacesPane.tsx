import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { SpaceCard } from "@/components/SpaceCard";
import { ListSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { filterSpaces } from "@/features/spaces/search";
import { useSpaceBrowser } from "@/features/spaces/useSpaceBrowser";
import { useManualRefresh } from "@/features/feedback/useManualRefresh";
import type { ForegroundLocation } from "@/features/location/useForegroundLocation";

type SpacesPaneProps = {
  location: ForegroundLocation;
  /** Text typed in the search bar; empty shows every space. */
  search: string;
  onClearSearch: () => void;
};

// The "Espaces" half of the Réserver tab: a one-tap "près de moi" card, then
// every space (nearest first once the position is known) filtered by the
// search bar. Tapping a space opens its own page to pick day and hours.
export function SpacesPane({ location, search, onClearSearch }: SpacesPaneProps) {
  const router = useRouter();
  const query = useSpaceBrowser(location.coords);
  const { refreshing, onRefresh } = useManualRefresh(() => query.refetch());

  const all = query.data?.items ?? [];
  const items = filterSpaces(all, search);
  const searching = search.trim().length > 0;

  // The permission is asked here, at the moment of the action, never at launch.
  async function handleReserveNearMe() {
    const coords = location.coords ?? (await location.request());
    if (!coords) {
      Alert.alert(
        "Localisation nécessaire",
        "Autorisez la localisation pour réserver l’espace le plus proche de vous.",
      );
      return;
    }
    router.push({ pathname: "/reserve", params: { lat: String(coords.lat), lng: String(coords.lng) } });
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.space.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.header}>
          {!searching ? (
            <>
              <NearMeCard onPress={handleReserveNearMe} isLocating={location.isLocating} />
              <LocationNotice location={location} />
            </>
          ) : null}

          {query.isPending ? <ListSkeleton /> : null}
          {query.isError ? (
            <ScreenState
              tone="danger"
              message={query.error instanceof ApiError ? query.error.message : "Impossible de charger les espaces."}
              onRetry={() => query.refetch()}
            />
          ) : null}
          {query.isSuccess && all.length === 0 ? <ScreenState message="Aucun espace pour le moment." /> : null}
          {query.isSuccess && all.length > 0 && items.length === 0 ? (
            <ScreenState
              message={`Aucun espace ne correspond à « ${search.trim()} ».`}
              onRetry={onClearSearch}
              retryLabel="Effacer la recherche"
            />
          ) : null}
          {items.length > 0 ? <SectionLabel text={countLabel(items.length, searching)} /> : null}
        </View>
      }
      renderItem={({ item }) => (
        <SpaceCard
          item={item}
          onPress={() => router.push({ pathname: "/space/[id]", params: { id: item.space.id } })}
        />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

function countLabel(count: number, searching: boolean): string {
  const noun = `espace${count === 1 ? "" : "s"}`;
  return searching ? `${count} ${noun} trouvé${count === 1 ? "" : "s"}` : `${count} ${noun}`;
}

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionLabel, { color: colors.inkMuted }]}>{text}</Text>;
}

// The one-tap route into booking, given the space a full-width card instead
// of a lone button floating above the list.
function NearMeCard({ onPress, isLocating }: { onPress: () => void; isLocating: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Réserver près de moi"
      onPress={onPress}
      disabled={isLocating}
      style={({ pressed }) => [
        styles.nearMe,
        { backgroundColor: colors.accent, opacity: pressed || isLocating ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.nearMeIcon, { backgroundColor: `${colors.accentText}2e` }]}>
        <SymbolView name="location.fill" tintColor={colors.accentText} size={22} />
      </View>
      <View style={styles.nearMeText}>
        <Text style={{ color: colors.accentText, fontSize: 17, fontWeight: "700" }}>Réserver près de moi</Text>
        <Text style={{ color: colors.accentText, opacity: 0.85 }}>
          L’espace libre le plus proche, en quelques secondes
        </Text>
      </View>
      {isLocating ? (
        <ActivityIndicator color={colors.accentText} />
      ) : (
        <SymbolView name="chevron.right" tintColor={colors.accentText} size={16} />
      )}
    </Pressable>
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
    <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ color: colors.ink }}>{text}</Text>
      <View style={styles.noticeActions}>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => location.request()}
            disabled={location.isLocating}
            style={({ pressed }) => [
              styles.noticeButton,
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

const styles = StyleSheet.create({
  // Bottom padding keeps the last card clear of the floating "+" button.
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 12, flexGrow: 1 },
  header: { gap: 12 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  nearMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    minHeight: 76,
  },
  nearMeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  nearMeText: { flex: 1, gap: 2 },
  notice: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 12 },
  noticeActions: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" },
  noticeButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkButton: { minHeight: 44, justifyContent: "center" },
});
