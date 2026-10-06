import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";
import { useToast } from "@/features/feedback/ToastContext";
import { Logo } from "@/components/Logo";
import { PasswordField } from "@/components/PasswordField";
import { RevealOnMount } from "@/components/RevealOnMount";

// Mirrors the web app's /connexion copy and its demo quick-fill pattern (see
// docs/base-de-donnees.md there) — continuity with the web, see CLAUDE.md
// "Identité". Demo password `demo1234` only fills the fields; the person
// still taps "Se connecter" themselves, same as on the web.
const DEMO_ACCOUNT = { email: "camille@example.com", password: "demo1234" };

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      // No navigation call needed: RootNavigator's Stack.Protected reacts to
      // the auth state change and swaps in the (app) group by itself — the
      // toast still shows, now on top of the dashboard it just swapped to.
      toast.show("Connexion réussie.");
    } catch (caught) {
      // Kept inline too, not just a toast: a wrong-password message needs
      // more than 3 seconds to read and act on.
      const message = caught instanceof ApiError ? caught.message : "Une erreur est survenue.";
      setError(message);
      toast.show(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <RevealOnMount>
            <View style={styles.hero}>
              <Logo size={34} textSize={28} />
              <Text style={[styles.tagline, { color: colors.inkMuted }]}>
                Votre espace de coworking, où que vous soyez.
              </Text>
            </View>
          </RevealOnMount>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.ink }]}>Connexion</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
                setError(null);
              }}
              style={({ pressed }) => [
                styles.demoButton,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <SymbolView name="sparkles" tintColor={colors.accent} size={16} />
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Compte de démonstration</Text>
            </Pressable>

            <View style={styles.field}>
              <Text style={{ color: colors.inkMuted }}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                placeholderTextColor={colors.inkMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Adresse e-mail"
                style={[styles.input, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.background }]}
              />
            </View>

            <PasswordField label="Mot de passe" value={password} onChangeText={setPassword} />

            {error ? (
              <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: colors.accent,
                  opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed && canSubmit ? 0.97 : 1 }],
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={[styles.submitText, { color: colors.accentText }]}>Se connecter</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.inkMuted }}>Pas encore de compte ?</Text>
            <Link href="/register" style={[styles.link, { color: colors.accent }]}>
              Créer un compte
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, flexGrow: 1, justifyContent: "center", gap: 28 },
  hero: { alignItems: "center", gap: 8 },
  tagline: { fontSize: 15, textAlign: "center" },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 20, gap: 16 },
  title: { fontSize: 22, fontFamily: "Fraunces_500Medium" },
  demoButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  field: { gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    minHeight: 48,
  },
  error: { fontSize: 14 },
  submit: {
    marginTop: 4,
    borderRadius: 12,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6 },
  link: { fontWeight: "600" },
});
