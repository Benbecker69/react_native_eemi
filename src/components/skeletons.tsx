import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/theme/colors";
import { Skeleton } from "@/components/Skeleton";

// Loading shapes that mirror the real screens (same card, same spacing), so
// nothing jumps when the data arrives. Each one is a single accessible
// element: VoiceOver says "Chargement en cours" once instead of reading blocks.

function LoadingGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Chargement en cours" style={style}>
      {children}
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

/** Rows of the Nearby, Reservations and History lists. */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <LoadingGroup style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Skeleton height={18} width="55%" />
              <Skeleton height={14} width="35%" />
              <Skeleton height={14} width="50%" />
            </View>
            <View style={styles.rowMeta}>
              <Skeleton height={22} width={72} radius={999} />
              <Skeleton height={14} width={48} />
            </View>
          </View>
        </Card>
      ))}
    </LoadingGroup>
  );
}

/** Profile tab: name, e-mail, credits. */
export function ProfileSkeleton() {
  return (
    <LoadingGroup>
      <Card>
        <Skeleton height={22} width="55%" />
        <Skeleton height={14} width="70%" />
        <Skeleton height={18} width="30%" style={styles.gapTop} />
      </Card>
    </LoadingGroup>
  );
}

/** Reservation detail: summary card, then the action button. */
export function DetailSkeleton() {
  return (
    <LoadingGroup style={styles.stack}>
      <Card>
        <Skeleton height={24} width="60%" />
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width="70%" />
        <Skeleton height={14} width="55%" />
        <Skeleton height={16} width="35%" style={styles.gapTop} />
      </Card>
      <Skeleton height={52} radius={12} />
    </LoadingGroup>
  );
}

/** Placeholder chips of an hour grid (the calendar above it stays interactive). */
export function HourGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <View style={styles.hourGrid}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} width={64} height={44} radius={10} />
      ))}
    </View>
  );
}

/** Space page: name, place, price, then the picker. */
export function SpaceSkeleton() {
  return (
    <LoadingGroup style={styles.stack}>
      <Skeleton height={26} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={14} width="65%" />
      <Skeleton height={16} width="45%" />
      <Skeleton height={300} radius={12} />
      <Skeleton height={16} width="20%" />
      <HourGridSkeleton />
    </LoadingGroup>
  );
}

/** "Réserver selon ma position": the proposed space card, then the picker. */
export function ProposalSkeleton() {
  return (
    <LoadingGroup style={styles.stack}>
      <Card>
        <Skeleton height={22} width="55%" />
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width="70%" />
        <Skeleton height={16} width="25%" style={styles.gapTop} />
      </Card>
      <Skeleton height={300} radius={12} />
      <Skeleton height={16} width="20%" />
      <HourGridSkeleton />
    </LoadingGroup>
  );
}

/** Security screen: two field-shaped forms (e-mail, password) while /me loads. */
export function SecurityFormSkeleton() {
  return (
    <LoadingGroup style={styles.stack}>
      <View style={styles.formBlock}>
        <Skeleton height={17} width="40%" />
        <Skeleton height={48} radius={12} />
        <Skeleton height={48} radius={12} />
        <Skeleton height={52} radius={12} style={styles.gapTop} />
      </View>
      <View style={styles.formBlock}>
        <Skeleton height={17} width="35%" />
        <Skeleton height={48} radius={12} />
        <Skeleton height={48} radius={12} />
        <Skeleton height={48} radius={12} />
        <Skeleton height={52} radius={12} style={styles.gapTop} />
      </View>
    </LoadingGroup>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  stack: { gap: 16 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowText: { flex: 1, gap: 8 },
  rowMeta: { alignItems: "flex-end", gap: 8 },
  gapTop: { marginTop: 8 },
  hourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  formBlock: { gap: 10 },
});
