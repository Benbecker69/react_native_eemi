import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { BookingSection } from "@/components/BookingSection";
import { ProposalSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { listNearbySpaces } from "@/services/spacesService";
import { useBookingForm } from "@/features/booking/useBookingForm";
import { formatDistance } from "@/utils/format";

// Modal, one-off action (see `mobile-design`, "Navigation pattern") — the
// entry point is the "Réserver près de moi" card on the Réserver tab, which
// already holds a fresh, permission-checked position before pushing here (see
// `components/SpacesPane.tsx`). This screen never asks for location itself.
//
// The nearest space that is free right now is proposed, then the same
// calendar and hours as a space's own page let the user pick the slot; the
// first bookable hour is preselected so the one-tap flow (open → confirm)
// still works.
export default function ReserveProposalScreen() {
  const colors = useColors();
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const hasCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  // Server default slot is now → +1 h, without `includeBusy`: the first item
  // is the nearest space that is bookable right now, not just the closest.
  const nearbyQuery = useQuery({
    queryKey: ["nearby-proposal", lat, lng],
    queryFn: () => listNearbySpaces({ lat: parsedLat, lng: parsedLng }),
    enabled: hasCoords,
  });
  const proposal = nearbyQuery.data?.items[0] ?? null;
  const form = useBookingForm(proposal?.space.id, { preselect: true });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {!hasCoords ? (
          <ScreenState tone="danger" message="Position manquante — fermez cet écran et réessayez." />
        ) : nearbyQuery.isPending ? (
          <ProposalSkeleton />
        ) : nearbyQuery.isError ? (
          <ScreenState
            tone="danger"
            message={
              nearbyQuery.error instanceof ApiError
                ? nearbyQuery.error.message
                : "Impossible de proposer un espace."
            }
            onRetry={() => nearbyQuery.refetch()}
          />
        ) : !proposal ? (
          <ScreenState message="Aucun espace disponible pour l’heure actuelle. Réessayez plus tard." />
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.spaceName, { color: colors.ink }]}>{proposal.space.name}</Text>
              <Text style={{ color: colors.inkMuted }}>{proposal.location.name}</Text>
              <Text style={{ color: colors.inkMuted }}>{proposal.location.address}</Text>
              <Text style={[styles.distance, { color: colors.accent }]}>
                {formatDistance(proposal.distanceM)}
              </Text>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 16 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 6 },
  spaceName: { fontSize: 20, fontFamily: "Fraunces_500Medium" },
  distance: { fontWeight: "700", marginTop: 4 },
});
