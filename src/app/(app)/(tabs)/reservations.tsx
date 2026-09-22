import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ApiError } from "@/services/ApiError";
import { listReservations, type ReservationsScope } from "@/services/reservationsService";
import { formatCredits, formatTimeRange } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

const SCOPES: { value: ReservationsScope; label: string }[] = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
  { value: "all", label: "Toutes" },
];

const PAGE_SIZE = 20;

// Cancel (Phase 5) will live here too, once the mutation exists — this tab
// is read-only for Phase 4 (« Lecture »).
export default function ReservationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [scope, setScope] = useState<ReservationsScope>("upcoming");

  const query = useInfiniteQuery({
    queryKey: ["reservations", scope],
    queryFn: ({ pageParam }) => listReservations({ scope, cursor: pageParam, limit: PAGE_SIZE }),
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
            <Text style={[styles.title, { color: colors.ink }]}>Réservations</Text>
            <View style={styles.scopeRow}>
              {SCOPES.map((option) => {
                const active = option.value === scope;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setScope(option.value)}
                    style={[
                      styles.scopeButton,
                      { backgroundColor: active ? colors.accent : colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Text style={{ color: active ? colors.accentText : colors.ink, fontWeight: "600" }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {query.isPending ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
            {query.isError ? (
              <ScreenState
                tone="danger"
                message={
                  query.error instanceof ApiError
                    ? query.error.message
                    : "Impossible de charger vos réservations."
                }
                onRetry={() => query.refetch()}
              />
            ) : null}
            {query.isSuccess && items.length === 0 ? <ScreenState message={emptyMessage(scope)} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <ReservationRow item={item} onPress={() => router.push(`/reservation/${item.id}`)} />
        )}
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

function emptyMessage(scope: ReservationsScope): string {
  switch (scope) {
    case "upcoming":
      return "Aucune réservation à venir. Rendez-vous sur « Autour de moi » pour réserver.";
    case "past":
      return "Aucune réservation passée pour l’instant.";
    default:
      return "Aucune réservation pour l’instant.";
  }
}

function ReservationRow({ item, onPress }: { item: ReservationDto; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.space.name}</Text>
        <Text style={{ color: colors.inkMuted }}>{item.location.name}</Text>
        <Text style={{ color: colors.inkMuted }}>{formatTimeRange(item.startAt, item.endAt)}</Text>
      </View>
      <View style={styles.rowMeta}>
        <StatusBadge status={item.status} />
        <Text style={{ color: colors.inkMuted }}>{formatCredits(item.creditsSpent)}</Text>
      </View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: ReservationDto["status"] }) {
  const colors = useColors();
  const label = status === "confirmed" ? "Confirmée" : status === "cancelled" ? "Annulée" : "Terminée";
  const tone = status === "cancelled" ? colors.danger : status === "confirmed" ? colors.accent : colors.inkMuted;
  return (
    <View style={[styles.badge, { borderColor: tone }]}>
      <Text style={{ color: tone, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { gap: 12, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  scopeRow: { flexDirection: "row", gap: 8 },
  scopeButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
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
  rowMeta: { alignItems: "flex-end", gap: 6 },
  badge: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
});
