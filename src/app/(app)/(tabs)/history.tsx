import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ApiError } from "@/services/ApiError";
import { listCheckIns } from "@/services/checkInsService";
import { formatDateTime, formatDistance } from "@/utils/format";
import type { CheckInHistoryDto } from "@/types/api";

const PAGE_SIZE = 20;

// Every attempt is kept, accepted or not — this is the trace the subject
// requires (see docs/api-mobile.md "Check-in"). The check-in action itself
// is Phase 5; this tab only reads the history.
export default function HistoryScreen() {
  const colors = useColors();

  const query = useInfiniteQuery({
    queryKey: ["check-ins"],
    queryFn: ({ pageParam }) => listCheckIns({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.ink }]}>Historique</Text>
            <Text style={{ color: colors.inkMuted }}>
              Chaque tentative d’arrivée est gardée, acceptée ou non.
            </Text>
            {query.isPending ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
            {query.isError ? (
              <ScreenState
                tone="danger"
                message={
                  query.error instanceof ApiError ? query.error.message : "Impossible de charger l’historique."
                }
                onRetry={() => query.refetch()}
              />
            ) : null}
            {query.isSuccess && items.length === 0 ? (
              <ScreenState message="Aucune tentative d’arrivée pour l’instant." />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <CheckInRow item={item} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null
        }
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => query.refetch()}
      />
    </SafeAreaView>
  );
}

function CheckInRow({ item }: { item: CheckInHistoryDto }) {
  const colors = useColors();
  const tone = item.accepted ? colors.accent : colors.danger;
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.reservation.space.name}</Text>
        <Text style={{ color: colors.inkMuted }}>{item.reservation.location.name}</Text>
        <Text style={{ color: colors.inkMuted }}>{formatDateTime(item.createdAt)}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={{ color: tone, fontWeight: "700" }}>
          {item.accepted ? "Arrivée validée" : reasonLabel(item.reason)}
        </Text>
        <Text style={{ color: colors.inkMuted }}>{formatDistance(item.distanceM)}</Text>
      </View>
    </View>
  );
}

function reasonLabel(reason: CheckInHistoryDto["reason"]): string {
  switch (reason) {
    case "TOO_EARLY":
      return "Trop tôt";
    case "TOO_LATE":
      return "Trop tard";
    case "TOO_FAR":
      return "Trop loin";
    case "LOW_ACCURACY":
      return "Précision insuffisante";
    case "STALE_POSITION":
      return "Position trop ancienne";
    case "NOT_CONFIRMED":
      return "Réservation non confirmée";
    default:
      return "Refusée";
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { gap: 8, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  spinner: { alignSelf: "flex-start" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowMeta: { alignItems: "flex-end", gap: 4 },
});
