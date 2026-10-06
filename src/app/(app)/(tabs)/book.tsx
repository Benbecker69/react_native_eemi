import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/theme/colors";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SearchBar } from "@/components/SearchBar";
import { SpacesPane } from "@/components/SpacesPane";
import { ReservationsPane } from "@/components/ReservationsPane";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useForegroundLocation } from "@/features/location/useForegroundLocation";

type Mode = "spaces" | "reservations";

const MODES: { value: Mode; label: string }[] = [
  { value: "spaces", label: "Espaces" },
  { value: "reservations", label: "Mes réservations" },
];

// One tab for everything about booking (it replaces the old "Autour de moi"
// and "Réservations" tabs, which both existed to create reservations):
//   Espaces           → find a space (search, nearest first) and open it to book;
//                       the "près de moi" card is the one-tap way in.
//   Mes réservations  → the bookings, filtered by when they happen.
// The round "+" is always reachable: it opens the new-reservation form.
export default function BookTabScreen() {
  const colors = useColors();
  const router = useRouter();
  // Owned here so the position survives switching between the two halves.
  const location = useForegroundLocation();
  const [mode, setMode] = useState<Mode>("spaces");
  // The home screen's shortcuts open this tab on one half or the other. This
  // tab stays mounted between visits, so the param is applied when it changes
  // (`at` is new on every tap), during render — the pattern React documents
  // for "adjusting state when a prop changes", with no effect involved.
  const params = useLocalSearchParams<{ mode?: Mode; at?: string }>();
  const [appliedAt, setAppliedAt] = useState<string | undefined>(undefined);
  if (params.at !== appliedAt) {
    setAppliedAt(params.at);
    if (params.mode === "spaces" || params.mode === "reservations") setMode(params.mode);
  }
  const [search, setSearch] = useState("");

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <PageHeader title="Réserver" description="Trouvez un espace disponible et réservez en quelques secondes." />
        <SegmentedControl
          options={MODES}
          value={mode}
          onChange={setMode}
          accessibilityLabel="Espaces ou mes réservations"
        />
        {mode === "spaces" ? (
          <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher une salle" />
        ) : null}
      </View>

      {mode === "spaces" ? (
        <SpacesPane location={location} search={search} onClearSearch={() => setSearch("")} />
      ) : (
        <ReservationsPane onBrowseSpaces={() => setMode("spaces")} />
      )}

      <FloatingActionButton
        accessibilityLabel="Nouvelle réservation"
        onPress={() => router.push({ pathname: "/new-reservation" })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
});
