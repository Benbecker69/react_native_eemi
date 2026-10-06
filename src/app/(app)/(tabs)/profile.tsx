import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { me } from "@/services/authService";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";
import { useToast } from "@/features/feedback/ToastContext";
import { ProfileSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/PageHeader";
import { formatCredits } from "@/utils/format";
import type { MeUser } from "@/types/api";

// A clean summary + a short menu, not a page-long form — "Modifier mon
// profil" and "Sécurité" each get their own screen (same reasoning as the
// web's own settings tabs, adapted to a pushed-screen menu instead of tabs).
export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const { logout } = useAuth();
  const query = useQuery({ queryKey: ["me"], queryFn: me });

  function handleLogout() {
    Alert.alert("Se déconnecter ?", "Vous devrez vous reconnecter pour accéder à votre compte.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: () => {
          logout();
          toast.show("Déconnecté.");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Profil" />

        {query.isPending ? (
          <ProfileSkeleton />
        ) : query.isError ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.danger }}>
              {query.error instanceof ApiError ? query.error.message : "Impossible de charger votre profil."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => query.refetch()}
              style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <SummaryCard user={query.data} />

            <View style={styles.menu}>
              <MenuRow
                icon="person.fill"
                label="Modifier mon profil"
                onPress={() => router.push("/profile-edit")}
              />
              <MenuRow icon="lock.fill" label="Sécurité" onPress={() => router.push("/security")} />
            </View>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logout, { borderColor: colors.danger, opacity: pressed ? 0.7 : 1 }]}
        >
          <SymbolView name="rectangle.portrait.and.arrow.right" tintColor={colors.danger} size={18} />
          <Text style={{ color: colors.danger, fontWeight: "700" }}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ user }: { user: MeUser }) {
  const colors = useColors();
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: `${colors.accent}1f`, borderColor: colors.accent }]}>
        <Text style={{ color: colors.accent, fontSize: 26, fontWeight: "700" }}>{initial}</Text>
      </View>
      <View style={styles.summaryText}>
        <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={{ color: colors.inkMuted }} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <Text style={[styles.creditsValue, { color: colors.ink }]}>{formatCredits(user.credits)}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <SymbolView name={icon} tintColor={colors.ink} size={18} />
      <Text style={[styles.menuLabel, { color: colors.ink }]}>{label}</Text>
      <SymbolView name="chevron.right" tintColor={colors.inkMuted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16, gap: 4 },
  retry: { marginTop: 8, minHeight: 44, justifyContent: "center" },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontFamily: "Fraunces_500Medium" },
  creditsValue: { fontSize: 16, fontFamily: "Fraunces_500Medium" },
  menu: { gap: 10 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  logout: {
    marginTop: "auto",
    flexDirection: "row",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
});
