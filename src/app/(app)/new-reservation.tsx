import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { SearchBar } from "@/components/SearchBar";
import { SpaceCard } from "@/components/SpaceCard";
import { BookingSection } from "@/components/BookingSection";
import { ListSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { filterSpaces } from "@/features/spaces/search";
import { useSpaceBrowser } from "@/features/spaces/useSpaceBrowser";
import { useBookingForm } from "@/features/booking/useBookingForm";
import { formatCredits } from "@/utils/format";
import type { NearbySpace } from "@/types/api";

// Modal reached from the round "+" on the Réserver tab: a form in two steps,
// on one screen — 1. choose a space (searchable list), 2. choose day and
// hours. Spaces are listed alphabetically, without asking for the position:
// this form is about what to book, not about what is close.
export default function NewReservationScreen() {
  const colors = useColors();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const query = useSpaceBrowser(null);

  const all = query.data?.items ?? [];
  const items = filterSpaces(all, search);
  const chosen = spaceId ? (all.find((item) => item.space.id === spaceId) ?? null) : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      {chosen ? (
        // `key`: picking another space starts a clean form (no hours carried over).
        <ChosenSpaceForm key={chosen.space.id} item={chosen} onChange={() => setSpaceId(null)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.space.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={[styles.step, { color: colors.ink }]}>1. Choisissez un espace</Text>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher une salle" />
              {query.isPending ? <ListSkeleton /> : null}
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
                <ScreenState
                  message={
                    all.length === 0 ? "Aucun espace pour le moment." : `Aucun espace ne correspond à « ${search.trim()} ».`
                  }
                  onRetry={all.length === 0 ? undefined : () => setSearch("")}
                  retryLabel="Effacer la recherche"
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => <SpaceCard item={item} onPress={() => setSpaceId(item.space.id)} />}
        />
      )}
    </SafeAreaView>
  );
}

function ChosenSpaceForm({ item, onChange }: { item: NearbySpace; onChange: () => void }) {
  const colors = useColors();
  const form = useBookingForm(item.space.id, { preselect: false });

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <Text style={[styles.step, { color: colors.ink }]}>2. Choisissez le jour et les heures</Text>

      <View style={[styles.chosen, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.chosenText}>
          <Text style={[styles.chosenName, { color: colors.ink }]}>{item.space.name}</Text>
          <Text style={{ color: colors.inkMuted }}>
            {item.location.name} · {formatCredits(item.space.pricePerHour)}/h
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChange}
          style={({ pressed }) => [styles.changeButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.accent, fontWeight: "600" }}>Changer</Text>
        </Pressable>
      </View>

      {form.availability.isError ? (
        <ScreenState
          tone="danger"
          message={
            form.availability.error instanceof ApiError
              ? form.availability.error.message
              : "Impossible de charger les créneaux."
          }
          onRetry={() => form.availability.refetch()}
        />
      ) : (
        <BookingSection form={form} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { padding: 16, gap: 12 },
  header: { gap: 12 },
  form: { padding: 24, gap: 16 },
  step: { fontSize: 20, fontWeight: "700" },
  chosen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
  },
  chosenText: { flex: 1, gap: 2 },
  chosenName: { fontSize: 17, fontWeight: "700" },
  changeButton: { minHeight: 44, justifyContent: "center" },
});
