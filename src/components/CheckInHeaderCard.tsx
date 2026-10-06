import { StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { checkInReasonLabel, formatDayHeading, formatTime } from "@/utils/format";
import type { CheckInHistoryDto } from "@/types/api";

// The check-in detail screen's own header: same accent-filled-when-good,
// neutral-otherwise language as `ReservationHeaderCard` — an accepted
// arrival is the "active, good outcome" case and gets the bold treatment; a
// refused attempt gets the calmer, neutral card.
export function CheckInHeaderCard({ checkIn }: { checkIn: CheckInHistoryDto }) {
  const colors = useColors();
  const accepted = checkIn.accepted;
  const foreground = accepted ? colors.accentText : colors.ink;
  const muted = accepted ? { color: foreground, opacity: 0.85 } : { color: colors.inkMuted };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accepted ? colors.accent : colors.surface,
          borderWidth: accepted ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.eyebrow, muted]}>{accepted ? "Arrivée validée" : "Arrivée refusée"}</Text>
      <Text style={[styles.day, { color: foreground }]}>
        {formatDayHeading(new Date(checkIn.createdAt))}
      </Text>
      <Text style={[styles.time, { color: foreground }]}>{formatTime(checkIn.createdAt)}</Text>
      <Text style={muted} numberOfLines={1}>
        {checkIn.reservation.space.name} · {checkIn.reservation.location.name}
      </Text>
      {accepted && checkIn.scannedSpaceId ? (
        <View style={styles.verifiedRow}>
          <SymbolView name="qrcode.viewfinder" tintColor={foreground} size={14} />
          <Text style={muted}>Vérifié par QR</Text>
        </View>
      ) : null}
      {!accepted ? (
        <Text style={[styles.reason, { color: colors.danger }]}>{checkInReasonLabel(checkIn.reason)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, gap: 4 },
  eyebrow: { fontSize: 13, fontWeight: "600" },
  day: { fontSize: 17, fontFamily: "Fraunces_500Medium", marginTop: 6 },
  time: { fontSize: 26, fontFamily: "Fraunces_600SemiBold" },
  reason: { fontWeight: "700", marginTop: 6 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
});
