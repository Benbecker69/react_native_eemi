import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { formatCredits, formatCreditsSpent } from "@/utils/format";

type BookingConfirmationProps = {
  slotLabel: string;
  /** Credits this booking would cost. */
  cost: number;
  /** Current balance; `undefined` while it is still loading. */
  balance: number | undefined;
  errorMessage: string | null;
  isPending: boolean;
  onConfirm: () => void;
};

// What the user sees right before validating: the chosen slot, what they have,
// what it would cost, what would be left. Shared by both booking screens. The
// server stays the judge of the balance (`INSUFFICIENT_CREDITS`); this only
// stops a tap that is known to fail.
export function BookingConfirmation({
  slotLabel,
  cost,
  balance,
  errorMessage,
  isPending,
  onConfirm,
}: BookingConfirmationProps) {
  const colors = useColors();
  const remaining = balance === undefined ? null : balance - cost;
  const insufficientCredits = remaining !== null && remaining < 0;
  const disabled = isPending || insufficientCredits;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.slot, { color: colors.ink }]}>{slotLabel}</Text>

      <View style={styles.rows}>
        {balance !== undefined ? <Row label="Votre solde" value={formatCredits(balance)} /> : null}
        <Row label="Coût de cette réservation" value={formatCreditsSpent(cost)} danger />
        {remaining !== null ? (
          <Row label="Solde après réservation" value={formatCredits(remaining)} danger={insufficientCredits} strong />
        ) : null}
      </View>

      {insufficientCredits ? (
        <Text style={{ color: colors.danger }}>Crédits insuffisants pour cette réservation.</Text>
      ) : null}
      {errorMessage ? <Text style={{ color: colors.danger }}>{errorMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={onConfirm}
        disabled={disabled}
        style={({ pressed }) => [
          styles.confirmButton,
          {
            backgroundColor: colors.accent,
            opacity: pressed || disabled ? 0.6 : 1,
            transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 16 }}>Confirmer la réservation</Text>
        )}
      </Pressable>
    </View>
  );
}

function Row({
  label,
  value,
  danger = false,
  strong = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
  strong?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.inkMuted }}>{label}</Text>
      <Text style={{ color: danger ? colors.danger : colors.ink, fontWeight: strong ? "700" : "600" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 12 },
  slot: { fontSize: 16, fontFamily: "Fraunces_500Medium" },
  rows: { gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  confirmButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
