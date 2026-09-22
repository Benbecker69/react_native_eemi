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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";

export default function RegisterScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
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
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.back, { color: colors.accent }]}>← Connexion</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.ink }]}>Créer un compte</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
            20 crédits de bienvenue à l’inscription.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Nom</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={colors.inkMuted}
              autoComplete="name"
              textContentType="name"
              accessibilityLabel="Nom"
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
              ]}
            />
          </View>

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
              placeholder="8 caractères minimum"
              placeholderTextColor={colors.inkMuted}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
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
              {submitting ? "Création…" : "Créer mon compte"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, gap: 4, flexGrow: 1, justifyContent: "center" },
  backButton: { minHeight: 44, justifyContent: "center", marginBottom: 12, alignSelf: "flex-start" },
  back: { fontSize: 15, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 20 },
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
});
