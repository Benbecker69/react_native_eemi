import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ReservationHero } from "@/components/ReservationHero";
import { ReservationRow } from "@/components/ReservationRow";
import { ListSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import type { ReservationsScope } from "@/services/reservationsService";
import { useReservationsList } from "@/features/reservations/useReservationsList";
import { groupReservationsByDay } from "@/features/reservations/grouping";
import { useManualRefresh } from "@/features/feedback/useManualRefresh";
import type { ReservationDto } from "@/types/api";

const SCOPES: { value: ReservationsScope; label: string }[] = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
  { value: "all", label: "Toutes" },
];

// The "Mes réservations" half of the Réserver tab: the next booking featured
// on top — "À venir" only, the one scope whose ascending order guarantees
// it's really the nearest one — then the rest grouped by day like a native
// calendar list (sticky day headers), instead of one flat, undifferentiated
// stack of cards. Tapping any of them opens its detail (cancel, check-in).
export function ReservationsPane({ onBrowseSpaces }: { onBrowseSpaces: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const [scope, setScope] = useState<ReservationsScope>("upcoming");
  const { query, items } = useReservationsList(scope);
  const { refreshing, onRefresh } = useManualRefresh(() => query.refetch());
  const now = new Date();

  const hero = scope === "upcoming" ? (items[0] ?? null) : null;
  const rest = hero ? items.slice(1) : items;
  const sections = groupReservationsByDay(rest, now);

  function openDetail(item: ReservationDto) {
    router.push(`/reservation/${item.id}`);
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <SegmentedControl
            options={SCOPES}
            value={scope}
            onChange={setScope}
            accessibilityLabel="Filtrer mes réservations"
          />

          {hero ? <ReservationHero item={hero} onPress={() => openDetail(hero)} /> : null}

          {query.isPending ? <ListSkeleton /> : null}
          {query.isError ? (
            <ScreenState
              tone="danger"
              message={
                query.error instanceof ApiError ? query.error.message : "Impossible de charger vos réservations."
              }
              onRetry={() => query.refetch()}
            />
          ) : null}
          {query.isSuccess && items.length === 0 ? (
            <EmptyReservations scope={scope} onBrowseSpaces={onBrowseSpaces} />
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => <ReservationRow item={item} now={now} onPress={() => openDetail(item)} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      ListFooterComponent={query.isFetchingNextPage ? <ListSkeleton count={1} /> : null}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const EMPTY_CONTENT: Record<
  ReservationsScope,
  { icon: SFSymbol; title: string; subtitle: string; browsable: boolean }
> = {
  upcoming: {
    icon: "calendar.badge.plus",
    title: "Aucune réservation à venir",
    subtitle: "Trouvez un espace disponible près de vous et réservez en quelques secondes.",
    browsable: true,
  },
  past: {
    icon: "clock.fill",
    title: "Aucune réservation passée",
    subtitle: "Vos réservations déjà terminées s’afficheront ici.",
    browsable: false,
  },
  all: {
    icon: "calendar.badge.plus",
    title: "Aucune réservation pour l’instant",
    subtitle: "Trouvez un espace disponible près de vous et réservez en quelques secondes.",
    browsable: true,
  },
};

// A calmer, more deliberate "nothing here" than a bare line of muted text —
// an icon that matches the scope, a short explanation, and for the two
// scopes where it helps, a real button into the Espaces pane instead of a
// text link. "Passées" gets no button: there is nothing to browse toward.
function EmptyReservations({ scope, onBrowseSpaces }: { scope: ReservationsScope; onBrowseSpaces: () => void }) {
  const colors = useColors();
  const content = EMPTY_CONTENT[scope];
  const tone = content.browsable ? colors.accent : colors.inkMuted;

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${tone}1f` }]}>
        <SymbolView name={content.icon} tintColor={tone} size={26} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>{content.title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.inkMuted }]}>{content.subtitle}</Text>
      {content.browsable ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBrowseSpaces}
          style={({ pressed }) => [
            styles.emptyButton,
            { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={{ color: colors.accentText, fontWeight: "700" }}>Voir les espaces</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Bottom padding keeps the last row clear of the floating "+" button.
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 12, flexGrow: 1 },
  header: { gap: 12 },
  // Same size/weight as a `SlotPicker` section title ("Jour", "Début"…): one
  // consistent heading style for "a label above a group of things" app-wide.
  sectionHeader: { paddingVertical: 8 },
  sectionTitle: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 16, gap: 6 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { textAlign: "center", lineHeight: 20 },
  emptyButton: {
    marginTop: 10,
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
