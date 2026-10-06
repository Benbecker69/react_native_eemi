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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/services/ApiError";
import { useColors } from "@/theme/colors";
import { useToast } from "@/features/feedback/ToastContext";
import { Logo } from "@/components/Logo";
import { PasswordField } from "@/components/PasswordField";

export default function RegisterScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const toast = useToast();
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
      toast.show("Compte créé, bienvenue !");
    } catch (caught) {
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
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.back, { color: colors.accent }]}>← Connexion</Text>
          </Pressable>

          <View style={styles.hero}>
            <Logo size={30} textSize={24} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.ink }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
              20 crédits de bienvenue à l’inscription.
            </Text>

            <View style={styles.field}>
              <Text style={{ color: colors.inkMuted }}>Nom</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                placeholderTextColor={colors.inkMuted}
                autoComplete="name"
                textContentType="name"
                accessibilityLabel="Nom"
                style={[styles.input, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.background }]}
              />
            </View>

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

            <PasswordField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
            />

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
                <Text style={[styles.submitText, { color: colors.accentText }]}>Créer mon compte</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, flexGrow: 1, justifyContent: "center", gap: 20 },
  backButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  back: { fontSize: 15, fontWeight: "600" },
  hero: { alignItems: "center" },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 20, gap: 16 },
  title: { fontSize: 22, fontFamily: "Fraunces_500Medium" },
  subtitle: { fontSize: 14, marginTop: -8 },
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
});
