import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { PageHeader } from "@/components/PageHeader";
import { ScreenState } from "@/components/ScreenState";
import { MonthCalendar } from "@/components/MonthCalendar";
import { CheckInRow } from "@/components/CheckInRow";
import { ListSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { listCheckIns } from "@/services/checkInsService";
import { useManualRefresh } from "@/features/feedback/useManualRefresh";
import { filterCheckInsByDay, groupCheckInsByDay } from "@/features/checkins/grouping";
import { formatDay } from "@/utils/format";
import { startOfDay } from "@/features/booking/calendar";
import type { CheckInHistoryDto } from "@/types/api";

const PAGE_SIZE = 20;
const FILTER_RANGE_MONTHS_BACK = 12;

// Every attempt is kept, accepted or not — the trace the subject requires
// (see docs/api-mobile.md "Check-in"). Grouped by day like a native calendar
// list (same pattern as Mes réservations), with a date filter on top and a
// tap-through to the full detail of one attempt.
export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const now = new Date();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDay, setFilterDay] = useState<Date | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["check-ins"],
    queryFn: ({ pageParam }) => listCheckIns({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const { refreshing, onRefresh } = useManualRefresh(() => query.refetch());

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const visibleItems = filterDay ? filterCheckInsByDay(items, filterDay) : items;
  const sections = groupCheckInsByDay(visibleItems, now);

  function openDetail(item: CheckInHistoryDto) {
    router.push({ pathname: "/check-in/[id]", params: { id: item.id } });
  }

  function selectFilterDay(day: Date) {
    setFilterDay(day);
    setFilterOpen(false);
  }

  function clearFilter() {
    setFilterDay(null);
    setFilterOpen(false);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              title="Historique"
              description="Chaque tentative d’arrivée est gardée, acceptée ou non."
            />

            <FilterControl
              day={filterDay}
              open={filterOpen}
              onToggle={() => setFilterOpen((value) => !value)}
              onClear={clearFilter}
            />
            {filterOpen ? (
              <MonthCalendar
                selected={filterDay ?? now}
                minDate={startOfDay(new Date(now.getFullYear(), now.getMonth() - FILTER_RANGE_MONTHS_BACK, now.getDate()))}
                maxDate={now}
                today={now}
                onSelect={selectFilterDay}
              />
            ) : null}

            {query.isPending ? <ListSkeleton /> : null}
            {query.isError ? (
              <ScreenState
                tone="danger"
                message={
                  query.error instanceof ApiError ? query.error.message : "Impossible de charger l’historique."
                }
                onRetry={() => query.refetch()}
              />
            ) : null}
            {query.isSuccess && items.length === 0 ? <EmptyHistory /> : null}
            {query.isSuccess && items.length > 0 && visibleItems.length === 0 ? (
              <ScreenState
                message={`Aucune tentative le ${formatDay(filterDay as Date)}.`}
                onRetry={query.hasNextPage ? () => query.fetchNextPage() : clearFilter}
                retryLabel={query.hasNextPage ? "Charger plus pour continuer la recherche" : "Voir toutes les dates"}
              />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => <CheckInRow item={item} onPress={() => openDetail(item)} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        ListFooterComponent={query.isFetchingNextPage ? <ListSkeleton count={1} /> : null}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}

function FilterControl({
  day,
  open,
  onToggle,
  onClear,
}: {
  day: Date | null;
  open: boolean;
  onToggle: () => void;
  onClear: () => void;
}) {
  const colors = useColors();
  const active = day !== null;

  return (
    <View style={styles.filterRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: open }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.filterPill,
          {
            backgroundColor: active ? colors.accent : colors.surface,
            borderColor: active ? colors.accent : colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <SymbolView name="calendar" tintColor={active ? colors.accentText : colors.ink} size={15} />
        <Text style={{ color: active ? colors.accentText : colors.ink, fontWeight: "600" }}>
          {active ? formatDay(day) : "Filtrer par date"}
        </Text>
      </Pressable>
      {active ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Effacer le filtre"
          onPress={onClear}
          style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <SymbolView name="xmark.circle.fill" tintColor={colors.inkMuted} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyHistory() {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.inkMuted}1f` }]}>
        <SymbolView name="clock.fill" tintColor={colors.inkMuted} size={26} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>Aucune tentative d’arrivée</Text>
      <Text style={[styles.emptySubtitle, { color: colors.inkMuted }]}>
        Chaque « Je suis arrivé » tenté depuis une réservation s’affichera ici, accepté ou non.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12, flexGrow: 1 },
  header: { gap: 12, marginBottom: 4 },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
  },
  clearButton: { minHeight: 40, minWidth: 40, alignItems: "center", justifyContent: "center" },
  sectionHeader: { paddingVertical: 8 },
  // Same size/weight as a Mes réservations day header: one consistent
  // heading style for "a label above a group of things" app-wide.
  sectionTitle: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 16, gap: 6 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { textAlign: "center", lineHeight: 20 },
});
