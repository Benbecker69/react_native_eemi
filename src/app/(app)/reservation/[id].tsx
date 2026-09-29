import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ReservationHeaderCard } from "@/components/ReservationHeaderCard";
import { DetailSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { cancelReservation, getReservation } from "@/services/reservationsService";
import { createCheckIn } from "@/services/checkInsService";
import { canCancelReservation } from "@/features/reservations/rules";
import { checkInReasonLabel, formatDateTime } from "@/utils/format";
import { useForegroundLocation } from "@/features/location/useForegroundLocation";
import type { CheckInDto, CheckInState, ReservationDto } from "@/types/api";

export default function ReservationDetailScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id),
    enabled: Boolean(id),
  });

  // High accuracy here, not the Nearby tab's Balanced (~100 m): the server
  // rejects a fix worse than 100 m (LOW_ACCURACY), so Balanced would sit
  // right at that edge — see `useForegroundLocation`'s own doc comment.
  const checkInLocation = useForegroundLocation(Location.Accuracy.High);

  const cancelMutation = useMutation({
    mutationFn: () => cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      // Always a fresh read, never the hook's possibly-stale auto-fetched
      // `coords` — the server refuses a position older than 60 s.
      const coords = await checkInLocation.request();
      if (!coords) {
        throw new ApiError(
          0,
          "MISSING_CONFIG",
          "Localisation indisponible — vérifiez qu’elle est autorisée et que le GPS est activé.",
        );
      }
      if (coords.accuracyM === null) {
        throw new ApiError(0, "MISSING_CONFIG", "Précision de la position indisponible, réessayez.");
      }
      return createCheckIn(id, {
        lat: coords.lat,
        lng: coords.lng,
        accuracyM: coords.accuracyM,
        capturedAt: coords.capturedAt,
      });
    },
    onSuccess: () => {
      // A refused attempt is still a success response (201) — only an
      // accepted one flips `checkIn.state` to "done" server-side, so this
      // refetch is what lets the button disappear once it truly worked.
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
    },
  });

  function handleCancel() {
    Alert.alert("Annuler la réservation ?", "Vos crédits seront remboursés.", [
      { text: "Garder", style: "cancel" },
      { text: "Annuler la réservation", style: "destructive", onPress: () => cancelMutation.mutate() },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      {query.isPending ? (
        <ScrollView contentContainerStyle={styles.content}>
          <DetailSkeleton />
        </ScrollView>
      ) : query.isError ? (
        <View style={styles.content}>
          <ScreenState
            tone="danger"
            message={
              query.error instanceof ApiError
                ? query.error.message
                : "Impossible de charger cette réservation."
            }
            onRetry={() => query.refetch()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ReservationHeaderCard reservation={query.data} now={new Date()} />

          <ArrivalCard
            reservation={query.data}
            isPending={checkInMutation.isPending}
            result={checkInMutation.data ?? null}
            errorMessage={
              checkInMutation.isError
                ? checkInMutation.error instanceof ApiError
                  ? checkInMutation.error.message
                  : "Impossible de valider l’arrivée."
                : null
            }
            onCheckIn={() => checkInMutation.mutate()}
          />

          <CancelSection
            reservation={query.data}
            isPending={cancelMutation.isPending}
            errorMessage={
              cancelMutation.isError
                ? cancelMutation.error instanceof ApiError
                  ? cancelMutation.error.message
                  : "Impossible d’annuler cette réservation."
                : null
            }
            onCancel={handleCancel}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ArrivalCard({
  reservation,
  isPending,
  result,
  errorMessage,
  onCheckIn,
}: {
  reservation: ReservationDto;
  isPending: boolean;
  result: { checkIn: CheckInDto } | null;
  errorMessage: string | null;
  onCheckIn: () => void;
}) {
  const colors = useColors();
  const state = reservation.checkIn.state;

  // Nothing meaningful to say about arrival on a cancelled reservation — the
  // server only ever reports "unavailable" for a non-confirmed one.
  if (state === "unavailable") return null;

  const showWindow = state === "available" || state === "too_early";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>Arrivée</Text>
      <Text style={{ color: colors.inkMuted }}>{checkInLabel(state)}</Text>
      {showWindow ? (
        <Text style={{ color: colors.inkMuted }}>
          Fenêtre : {formatDateTime(reservation.checkIn.opensAt)} → {formatDateTime(reservation.checkIn.closesAt)}
        </Text>
      ) : null}
      {reservation.checkIn.doneAt ? (
        <Text style={{ color: colors.inkMuted }}>Validée le {formatDateTime(reservation.checkIn.doneAt)}</Text>
      ) : null}

      {state === "available" ? (
        <View style={styles.cardAction}>
          {result ? (
            <Text style={{ color: result.checkIn.accepted ? colors.accent : colors.danger, fontWeight: "600" }}>
              {result.checkIn.accepted
                ? "Arrivée validée !"
                : `Non validée : ${checkInReasonLabel(result.checkIn.reason)}.`}
            </Text>
          ) : null}
          {errorMessage ? <Text style={{ color: colors.danger }}>{errorMessage}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={onCheckIn}
            disabled={isPending}
            style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: colors.accent, opacity: pressed || isPending ? 0.6 : 1 },
            ]}
          >
            {isPending ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 16 }}>Je suis arrivé</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CancelSection({
  reservation,
  isPending,
  errorMessage,
  onCancel,
}: {
  reservation: ReservationDto;
  isPending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
}) {
  const colors = useColors();
  const now = new Date();

  if (!canCancelReservation(reservation, now)) {
    // Explains the missing button rather than leaving it looking forgotten —
    // only for a genuinely past one; a cancelled reservation already says so
    // clearly enough via the header above.
    if (reservation.status === "confirmed") {
      return <Text style={{ color: colors.inkMuted }}>Cette réservation a déjà commencé : elle ne peut plus être annulée.</Text>;
    }
    return null;
  }

  return (
    <View style={styles.actionGroup}>
      {errorMessage ? <Text style={{ color: colors.danger }}>{errorMessage}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        disabled={isPending}
        style={({ pressed }) => [
          styles.dangerButton,
          { borderColor: colors.danger, opacity: pressed || isPending ? 0.6 : 1 },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text style={{ color: colors.danger, fontWeight: "700" }}>Annuler la réservation</Text>
        )}
      </Pressable>
    </View>
  );
}

function checkInLabel(state: CheckInState): string {
  switch (state) {
    case "available":
      return "Vous pouvez valider votre arrivée dans la fenêtre indiquée.";
    case "too_early":
      return "Trop tôt — l’arrivée s’active 15 minutes avant le début.";
    case "expired":
      return "La fenêtre d’arrivée est terminée.";
    case "done":
      return "Arrivée déjà validée.";
    case "unavailable":
      return "Arrivée non disponible pour cette réservation.";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardAction: { gap: 8, marginTop: 4 },
  actionGroup: { gap: 8 },
  dangerButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
