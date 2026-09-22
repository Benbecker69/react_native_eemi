import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import type { Colors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ApiError } from "@/services/ApiError";
import { getReservation } from "@/services/reservationsService";
import { formatCredits, formatDateTime } from "@/utils/format";
import type { CheckInState, ReservationDto } from "@/types/api";

// Read-only in Phase 4 — cancel and "Je suis arrivé" (mutations) are Phase 5.
export default function ReservationDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id),
    enabled: Boolean(id),
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      {query.isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
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
          <ReservationSummary reservation={query.data} colors={colors} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReservationSummary({ reservation, colors }: { reservation: ReservationDto; colors: Colors }) {
  return (
    <>
      <Text style={[styles.title, { color: colors.ink }]}>{reservation.space.name}</Text>
      <Text style={{ color: colors.inkMuted }}>{reservation.location.name}</Text>
      <Text style={{ color: colors.inkMuted }}>{reservation.location.address}</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Row label="Début" value={formatDateTime(reservation.startAt)} colors={colors} />
        <Row label="Fin" value={formatDateTime(reservation.endAt)} colors={colors} />
        <Row label="Coût" value={formatCredits(reservation.creditsSpent)} colors={colors} />
        <Row label="Statut" value={statusLabel(reservation.status)} colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>Arrivée</Text>
        <Text style={{ color: colors.inkMuted }}>{checkInLabel(reservation.checkIn.state)}</Text>
        {reservation.checkIn.state === "available" || reservation.checkIn.state === "too_early" ? (
          <Text style={{ color: colors.inkMuted }}>
            Fenêtre : {formatDateTime(reservation.checkIn.opensAt)} → {formatDateTime(reservation.checkIn.closesAt)}
          </Text>
        ) : null}
        {reservation.checkIn.doneAt ? (
          <Text style={{ color: colors.inkMuted }}>Validée le {formatDateTime(reservation.checkIn.doneAt)}</Text>
        ) : null}
      </View>
    </>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.inkMuted }}>{label}</Text>
      <Text style={{ color: colors.ink, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function statusLabel(status: ReservationDto["status"]): string {
  switch (status) {
    case "confirmed":
      return "Confirmée";
    case "cancelled":
      return "Annulée";
    case "completed":
      return "Terminée";
    default:
      return status;
  }
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
  spinner: { flex: 1, alignSelf: "center" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
