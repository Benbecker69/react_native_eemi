import { useState } from "react";
import {
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
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";

// Mirrors the web app's /connexion copy and its demo quick-fill pattern (see
// docs/base-de-donnees.md there) — continuity with the web, see CLAUDE.md
// "Identité". Demo password `demo1234` only fills the fields; the person
// still taps "Se connecter" themselves, same as on the web.
const DEMO_ACCOUNT = { email: "camille@example.com", password: "demo1234" };

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
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
      // the auth state change and swaps in the (app) group by itself.
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.brand, { color: colors.ink }]}>Repère</Text>
          <Text style={[styles.title, { color: colors.ink }]}>Connexion</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
            Accédez à votre espace Repère.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEmail(DEMO_ACCOUNT.email);
              setPassword(DEMO_ACCOUNT.password);
              setError(null);
            }}
            style={({ pressed }) => [
              styles.demoButton,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={{ color: colors.ink }}>Compte de démonstration</Text>
          </Pressable>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>E-mail</Text>
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
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.inkMuted}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              accessibilityLabel="Mot de passe"
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
              ]}
            />
          </View>

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
              { backgroundColor: colors.accent, opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.submitText, { color: colors.accentText }]}>
              {submitting ? "Connexion…" : "Se connecter"}
            </Text>
          </Pressable>

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
  content: { padding: 24, gap: 4, flexGrow: 1, justifyContent: "center" },
  brand: { fontSize: 20, fontWeight: "600", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 20 },
  demoButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 24,
    minHeight: 44,
    justifyContent: "center",
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  error: { fontSize: 14, marginTop: 4, marginBottom: 8 },
  submit: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
  link: { fontWeight: "600" },
});
