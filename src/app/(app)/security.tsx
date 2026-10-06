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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { PasswordField } from "@/components/PasswordField";
import { ApiError } from "@/services/ApiError";
import { changeEmail, changePassword, me } from "@/services/authService";
import { useScreenLock } from "@/features/auth/useScreenLock";
import { useToast } from "@/features/feedback/ToastContext";
import { SecurityFormSkeleton } from "@/components/skeletons";

// Neither form here exists on the web yet — its own "Sécurité" tab is
// read-only and says password changes are "coming in a future update" (see
// docs/api-mobile.md "POST /me/password"). Both require the current
// password: a stored session token alone doesn't prove it's still the
// account's owner typing, not a device that only has a stolen token.
//
// The screen itself is also gated behind Face ID / Touch ID / the device
// passcode (see `useScreenLock`) — one more reason a glanced-at or borrowed
// phone can't reach these forms, on top of the current-password requirement
// inside them.
export default function SecurityScreen() {
  const colors = useColors();
  const router = useRouter();
  const lock = useScreenLock("Déverrouillez pour accéder à la sécurité de votre compte");
  const query = useQuery({ queryKey: ["me"], queryFn: me, enabled: lock.state !== "locked" && lock.state !== "checking" });

  if (lock.state === "checking") {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (lock.state === "locked") {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.lockedContent}>
          <SymbolView name="lock.fill" tintColor={colors.inkMuted} size={32} />
          <Text style={[styles.lockedTitle, { color: colors.ink }]}>Accès verrouillé</Text>
          <Text style={{ color: colors.inkMuted, textAlign: "center" }}>
            Authentifiez-vous pour accéder à vos paramètres de sécurité.
          </Text>
          <View style={styles.lockedActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => lock.retry()}
              style={({ pressed }) => [styles.lockedButton, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ color: colors.accentText, fontWeight: "700" }}>Réessayer</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.lockedBack, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {query.isPending ? (
            <SecurityFormSkeleton />
          ) : query.isError ? (
            <ScreenState
              tone="danger"
              message={query.error instanceof ApiError ? query.error.message : "Impossible de charger votre compte."}
              onRetry={() => query.refetch()}
            />
          ) : (
            <>
              <EmailSection currentEmail={query.data.email} />
              <PasswordSection />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => changeEmail({ currentPassword, email: email.trim() }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setEmail("");
      setCurrentPassword("");
      toast.show("Adresse e-mail mise à jour.");
    },
    onError: (error) => {
      toast.show(
        error instanceof ApiError ? error.message : "Impossible de modifier l’adresse e-mail.",
        "error",
      );
    },
  });

  const canSave = /\S+@\S+\.\S+/.test(email.trim()) && currentPassword.length > 0 && !mutation.isPending;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Adresse e-mail</Text>
      <Text style={{ color: colors.inkMuted }}>Actuelle : {currentEmail}</Text>

      <View style={styles.field}>
        <Text style={{ color: colors.inkMuted }}>Nouvelle adresse e-mail</Text>
        <TextInput
          value={email}
          onChangeText={(value) => {
            mutation.reset();
            setEmail(value);
          }}
          placeholder="vous@exemple.com"
          placeholderTextColor={colors.inkMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel="Nouvelle adresse e-mail"
          style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      </View>

      <PasswordField
        label="Mot de passe actuel"
        value={currentPassword}
        onChangeText={(value) => {
          mutation.reset();
          setCurrentPassword(value);
        }}
        placeholder="Pour confirmer que c’est bien vous"
      />

      <SaveButton label="Modifier l’adresse e-mail" disabled={!canSave} pending={mutation.isPending} onPress={() => mutation.mutate()} />
    </View>
  );
}

function PasswordSection() {
  const colors = useColors();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.show("Mot de passe modifié. Vos autres appareils connectés ont été déconnectés.");
    },
    onError: (error) => {
      toast.show(
        error instanceof ApiError ? error.message : "Impossible de modifier le mot de passe.",
        "error",
      );
    },
  });

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSave =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && !mutation.isPending;

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      mutation.reset();
      setter(value);
    };
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Mot de passe</Text>

      <PasswordField
        label="Mot de passe actuel"
        value={currentPassword}
        onChangeText={edit(setCurrentPassword)}
      />
      <PasswordField
        label="Nouveau mot de passe"
        value={newPassword}
        onChangeText={edit(setNewPassword)}
        placeholder="8 caractères minimum"
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirmer le nouveau mot de passe"
        value={confirmPassword}
        onChangeText={edit(setConfirmPassword)}
        autoComplete="new-password"
      />
      {mismatch ? <Text style={{ color: colors.danger }}>Les deux mots de passe ne correspondent pas.</Text> : null}

      <SaveButton label="Modifier le mot de passe" disabled={!canSave} pending={mutation.isPending} onPress={() => mutation.mutate()} />
    </View>
  );
}

function SaveButton({
  label,
  disabled,
  pending,
  onPress,
}: {
  label: string;
  disabled: boolean;
  pending: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.saveButton,
        {
          backgroundColor: colors.accent,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
      ]}
    >
      {pending ? <ActivityIndicator color={colors.accentText} /> : <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 16 }}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, gap: 32, flexGrow: 1 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Fraunces_500Medium" },
  field: { gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { alignItems: "center", justifyContent: "center" },
  lockedContent: { alignItems: "center", gap: 10, paddingHorizontal: 32 },
  lockedTitle: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  lockedActions: { marginTop: 16, alignItems: "center", gap: 4 },
  lockedButton: {
    minWidth: 160,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBack: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center" },
});
