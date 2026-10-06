import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";
import { Logo } from "@/components/Logo";
import { ScreenState } from "@/components/ScreenState";
import { ReservationHero } from "@/components/ReservationHero";
import { QuickActions } from "@/components/QuickActions";
import { ActivityPanel } from "@/components/ActivityPanel";
import { UpcomingList } from "@/components/UpcomingList";
import { HomeSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { splitName } from "@/features/auth/name";
import { greeting, startsInLabel } from "@/features/home/insights";
import { useHomeDashboard } from "@/features/home/useHomeDashboard";
import { useManualRefresh } from "@/features/feedback/useManualRefresh";
import { formatDayHeading } from "@/utils/format";
import type { ReservationDto } from "@/types/api";

// Where the app opens once signed in: what is next (the coming reservation,
// or an invitation to book), the three things people come to do, then the
// member's figures and the bookings after the next one. Read top to bottom,
// it answers "what do I have, what can I do, where do I stand".
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const dashboard = useHomeDashboard();
  const { refreshing, onRefresh } = useManualRefresh(dashboard.refetch);
  const now = new Date();

  const { user, summary, upcoming } = dashboard;
  const next = upcoming[0] ?? null;
  const later = upcoming.slice(1);

  function openReservation(item: ReservationDto) {
    router.push(`/reservation/${item.id}`);
  }

  // `at` makes each tap a new request: the Réserver tab stays mounted, and
  // would otherwise ignore a second "show my reservations" with the same params.
  function openBookTab(mode: "spaces" | "reservations") {
    router.navigate({ pathname: "/book", params: { mode, at: String(Date.now()) } });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.topBar}>
          <Logo size={22} textSize={18} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
            onPress={() => router.navigate("/profile")}
            style={({ pressed }) => [
              styles.avatar,
              { backgroundColor: `${colors.accent}1f`, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {user ? (
              <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                {user.name.trim().charAt(0).toUpperCase() || "?"}
              </Text>
            ) : (
              <SymbolView name="person.fill" tintColor={colors.accent} size={18} />
            )}
          </Pressable>
        </View>

        <View style={styles.greeting}>
          <Text style={[styles.title, { color: colors.ink }]}>
            {greeting(now, user ? splitName(user.name).firstName : "")}
          </Text>
          <Text style={{ color: colors.inkMuted }}>{formatDayHeading(now)}</Text>
        </View>

        {dashboard.error ? (
          <ScreenState
            tone="danger"
            message={
              dashboard.error instanceof ApiError
                ? dashboard.error.message
                : "Impossible de charger votre tableau de bord."
            }
            onRetry={() => dashboard.refetch()}
          />
        ) : dashboard.isPending || !user || !summary ? (
          <HomeSkeleton />
        ) : (
          <>
            {next ? (
              <ReservationHero
                item={next}
                caption={startsInLabel(next, now)}
                onPress={() => openReservation(next)}
              />
            ) : (
              <NoReservationCard onPress={() => openBookTab("spaces")} />
            )}

            <QuickActions
              actions={[
                { icon: "location.fill", label: "Trouver un espace", onPress: () => openBookTab("spaces") },
                {
                  icon: "calendar.badge.plus",
                  label: "Nouvelle réservation",
                  onPress: () => router.push({ pathname: "/new-reservation" }),
                },
                { icon: "clock.fill", label: "Mes arrivées", onPress: () => router.navigate("/history") },
              ]}
            />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Votre activité</Text>
              <ActivityPanel credits={user.credits} summary={summary} />
            </View>

            {later.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>Ensuite</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Voir toutes mes réservations"
                    onPress={() => openBookTab("reservations")}
                    hitSlop={12}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text style={{ color: colors.accent, fontWeight: "600" }}>Tout voir</Text>
                  </Pressable>
                </View>
                <UpcomingList items={later} onPress={openReservation} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// The empty state of the featured slot: same place and weight as the next
// reservation would have, so the screen keeps its shape for a new member.
function NoReservationCard({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>Aucune réservation à venir</Text>
      <Text style={{ color: colors.inkMuted, lineHeight: 20 }}>
        Trouvez un espace libre près de vous et réservez-le en quelques secondes.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.emptyButton,
          {
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 16 }}>Réserver un espace</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  // Three spacing steps: 28 between sections, 12 inside one, 4 between a title and its date.
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 28 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 18, fontWeight: "700" },
  greeting: { gap: 4, marginTop: -8 },
  title: { fontSize: 30, lineHeight: 38, fontFamily: "Fraunces_500Medium" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontFamily: "Fraunces_500Medium" },
  emptyCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 18, gap: 8 },
  emptyTitle: { fontSize: 20, fontFamily: "Fraunces_500Medium" },
  emptyButton: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
