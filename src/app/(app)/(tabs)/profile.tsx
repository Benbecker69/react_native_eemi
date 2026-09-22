import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { me } from "@/services/authService";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";

// The one tab with real content in Phase 3: proves the session survives a
// restart (GET /me succeeds using the restored token) and that logout really
// revokes it server-side (see docs/api-mobile.md "Authentification").
export default function ProfileScreen() {
  const colors = useColors();
  const { logout } = useAuth();
  const query = useQuery({ queryKey: ["me"], queryFn: me });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.ink }]}>Profil</Text>

        {query.isPending ? (
          <ActivityIndicator color={colors.accent} style={styles.spinner} />
        ) : query.isError ? (
          <View style={styles.card}>
            <Text style={{ color: colors.danger }}>
              {query.error instanceof ApiError
                ? query.error.message
                : "Impossible de charger votre profil."}
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
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.name, { color: colors.ink }]}>{query.data.name}</Text>
            <Text style={{ color: colors.inkMuted }}>{query.data.email}</Text>
            <Text style={[styles.credits, { color: colors.ink }]}>
              {query.data.credits} crédits
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => logout()}
          style={({ pressed }) => [
            styles.logout,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: colors.danger, fontWeight: "600" }}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  spinner: { marginTop: 12, alignSelf: "flex-start" },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  name: { fontSize: 18, fontWeight: "600" },
  credits: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  retry: { marginTop: 8, minHeight: 44, justifyContent: "center" },
  logout: {
    marginTop: "auto",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
});
