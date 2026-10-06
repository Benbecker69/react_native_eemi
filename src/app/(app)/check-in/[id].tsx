import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { CheckInHeaderCard } from "@/components/CheckInHeaderCard";
import { useCheckInDetail } from "@/features/checkins/useCheckInDetail";
import { formatDay, formatHourRange } from "@/utils/format";

// Reached by tapping a row on Historique. Reads straight from that list's
// own cache (see `useCheckInDetail`) — every field here was already fetched,
// there is nothing left to load.
export default function CheckInDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkIn = useCheckInDetail(id);

  if (!checkIn) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.content}>
          <ScreenState
            tone="danger"
            message="Cette tentative n’est plus disponible — retournez à l’historique et réessayez."
          />
        </View>
      </SafeAreaView>
    );
  }

  const { reservation } = checkIn;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <CheckInHeaderCard checkIn={checkIn} />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>Détails</Text>
          <Row
            label="Créneau réservé"
            value={`${formatDay(new Date(reservation.startAt))}, ${formatHourRange(reservation.startAt, reservation.endAt)}`}
          />
          <Row label="Distance du lieu" value={`${Math.round(checkIn.distanceM)} m`} />
          <Row label="Précision du GPS" value={`± ${Math.round(checkIn.accuracyM)} m`} />
          {checkIn.accepted && checkIn.scannedSpaceId ? (
            <Row label="Vérification" value="QR + GPS" />
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/reservation/${checkIn.reservationId}`)}
          style={({ pressed }) => [
            styles.linkRow,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.linkLabel, { color: colors.ink }]}>Voir la réservation</Text>
          <SymbolView name="chevron.right" tintColor={colors.inkMuted} size={16} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.inkMuted }}>{label}</Text>
      <Text style={{ color: colors.ink, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: "Fraunces_500Medium" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  linkLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
});
