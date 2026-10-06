import { StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { attendanceRate, formatHours } from "@/features/home/insights";
import type { MemberSummary } from "@/types/api";

type ActivityPanelProps = { credits: number; summary: MemberSummary };

// The home screen's figures as one sheet ruled by hairlines — the balance on
// top, four figures under it, the favourite place as a footer — rather than
// six separate cards: the numbers belong together and read as one statement.
export function ActivityPanel({ credits, summary }: ActivityPanelProps) {
  const colors = useColors();
  const rate = attendanceRate(summary.attendance);
  const period = `${summary.windowDays} derniers jours`;
  const rule = { borderColor: colors.border };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View
        accessible
        accessibilityLabel={`Solde : ${credits} crédit${credits === 1 ? "" : "s"}`}
        style={styles.balance}
      >
        <Text style={[styles.label, { color: colors.inkMuted }]}>Solde</Text>
        <View style={styles.balanceLine}>
          <Text style={[styles.balanceValue, { color: colors.ink }]}>{credits}</Text>
          <Text style={[styles.balanceUnit, { color: colors.inkMuted }]}>
            crédit{credits === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={[styles.row, styles.ruleTop, rule]}>
        <Figure
          icon="calendar"
          label="À venir"
          value={String(summary.upcoming.count)}
          caption={summary.upcoming.count === 1 ? "réservation" : "réservations"}
        />
        <View style={[styles.ruleLeft, rule]} />
        <Figure
          icon="clock"
          label="Heures réservées"
          value={formatHours(summary.recent.hours)}
          caption={period}
        />
      </View>

      <View style={[styles.row, styles.ruleTop, rule]}>
        <Figure
          icon="creditcard"
          label="Crédits dépensés"
          value={String(summary.recent.creditsSpent)}
          caption={period}
        />
        <View style={[styles.ruleLeft, rule]} />
        <Figure
          icon="checkmark.seal"
          label="Présence"
          value={rate === null ? "—" : `${rate} %`}
          caption={
            rate === null
              ? "Aucune réservation terminée"
              : `${summary.attendance.attended} arrivée${summary.attendance.attended === 1 ? "" : "s"} sur ${summary.attendance.past}`
          }
          progress={rate}
        />
      </View>

      {summary.favoriteLocation ? (
        <View
          accessible
          accessibilityLabel={`Lieu favori : ${summary.favoriteLocation.name}, ${summary.favoriteLocation.city}`}
          style={[styles.favorite, styles.ruleTop, rule]}
        >
          <SymbolView name="mappin.and.ellipse" tintColor={colors.accent} size={18} />
          <View style={styles.favoriteText}>
            <Text style={[styles.label, { color: colors.inkMuted }]}>Lieu favori</Text>
            <Text style={[styles.favoriteName, { color: colors.ink }]} numberOfLines={1}>
              {summary.favoriteLocation.name} · {summary.favoriteLocation.city}
            </Text>
          </View>
          <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
            {summary.favoriteLocation.visits} visite{summary.favoriteLocation.visits === 1 ? "" : "s"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type FigureProps = {
  icon: SFSymbol;
  label: string;
  value: string;
  caption: string;
  /** 0–100: draws a thin bar under the value. Only the presence rate has one. */
  progress?: number | null;
};

function Figure({ icon, label, value, caption, progress }: FigureProps) {
  const colors = useColors();
  return (
    <View accessible accessibilityLabel={`${label} : ${value}, ${caption}`} style={styles.figure}>
      <View style={styles.figureLabel}>
        <SymbolView name={icon} tintColor={colors.inkMuted} size={14} />
        <Text style={[styles.label, { color: colors.inkMuted }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.figureValue, { color: colors.ink }]}>{value}</Text>
      {typeof progress === "number" ? (
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { backgroundColor: colors.accent, width: `${progress}%` }]} />
        </View>
      ) : null}
      <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: "hidden" },
  ruleTop: { borderTopWidth: StyleSheet.hairlineWidth },
  ruleLeft: { borderLeftWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 13, fontWeight: "500" },
  balance: { padding: 18, gap: 2 },
  balanceLine: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  balanceValue: { fontSize: 44, lineHeight: 52, fontFamily: "Fraunces_600SemiBold", fontVariant: ["tabular-nums"] },
  balanceUnit: { fontSize: 16 },
  row: { flexDirection: "row" },
  figure: { flex: 1, padding: 16, gap: 4 },
  figureLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  figureValue: { fontSize: 26, lineHeight: 34, fontFamily: "Fraunces_500Medium", fontVariant: ["tabular-nums"] },
  track: { height: 4, borderRadius: 2, overflow: "hidden", marginVertical: 2 },
  fill: { height: 4, borderRadius: 2 },
  favorite: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  favoriteText: { flex: 1, gap: 2 },
  favoriteName: { fontSize: 15, fontWeight: "600" },
});
