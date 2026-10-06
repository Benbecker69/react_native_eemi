import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { ProfileSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { me, updateProfile } from "@/services/authService";
import { useToast } from "@/features/feedback/ToastContext";
import { joinName, splitName } from "@/features/auth/name";
import type { MemberType, MeUser } from "@/types/api";

const NAME_MAX_LENGTH = 40;

const MEMBER_TYPES: { value: Exclude<MemberType, null>; label: string }[] = [
  { value: "freelance", label: "Freelance" },
  { value: "entreprise", label: "Entreprise" },
  { value: "etudiant", label: "Étudiant" },
];

// Same fields, same validation, same `users` row as the web's own "Profil"
// tab — see docs/api-mobile.md "PATCH /me".
export default function ProfileEditScreen() {
  const colors = useColors();
  const query = useQuery({ queryKey: ["me"], queryFn: me });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      {query.isPending ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ProfileSkeleton />
        </ScrollView>
      ) : query.isError ? (
        <View style={styles.content}>
          <ScreenState
            tone="danger"
            message={query.error instanceof ApiError ? query.error.message : "Impossible de charger votre profil."}
            onRetry={() => query.refetch()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <EditForm user={query.data} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type Draft = { firstName: string; lastName: string; memberType: Exclude<MemberType, null> | null };

function EditForm({ user }: { user: MeUser }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const toast = useToast();
  // What the user is typing, if they've touched the form; the server's own
  // value otherwise — the same "derive the default while rendering, no
  // effect" pattern as the booking screens' day/hour selection.
  const [draft, setDraft] = useState<Draft | null>(null);
  const serverName = splitName(user.name);
  const firstName = draft ? draft.firstName : serverName.firstName;
  const lastName = draft ? draft.lastName : serverName.lastName;
  const memberType = draft ? draft.memberType : user.memberType;

  function edit(patch: Partial<Draft>) {
    setDraft({ firstName, lastName, memberType, ...patch });
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!memberType) {
        throw new ApiError(0, "MISSING_CONFIG", "Choisissez le type de profil qui vous correspond.");
      }
      return updateProfile({ name: joinName(firstName, lastName), memberType });
    },
    onSuccess: (updated) => {
      // The response is already the fresh truth — no need to also invalidate
      // and refetch; every other screen reading ["me"] (balance, etc.) picks
      // this up next time it renders.
      queryClient.setQueryData(["me"], updated);
      setDraft(null);
      toast.show("Profil mis à jour.");
    },
    onError: (error) => {
      toast.show(error instanceof ApiError ? error.message : "Impossible d’enregistrer.", "error");
    },
  });

  const isValid = firstName.trim().length >= 1 && lastName.trim().length >= 1 && memberType !== null;
  // Compared against the trimmed/joined values that would actually be sent —
  // trailing whitespace alone shouldn't enable the button either.
  const isDirty = joinName(firstName, lastName) !== user.name || memberType !== user.memberType;
  const canSave = isValid && isDirty;

  return (
    <View style={styles.form}>
      <View style={styles.nameRow}>
        <View style={[styles.field, styles.nameField]}>
          <Text style={{ color: colors.inkMuted }}>Prénom</Text>
          <TextInput
            value={firstName}
            onChangeText={(value) => edit({ firstName: value })}
            placeholder="Prénom"
            placeholderTextColor={colors.inkMuted}
            maxLength={NAME_MAX_LENGTH}
            accessibilityLabel="Prénom"
            style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
        </View>
        <View style={[styles.field, styles.nameField]}>
          <Text style={{ color: colors.inkMuted }}>Nom</Text>
          <TextInput
            value={lastName}
            onChangeText={(value) => edit({ lastName: value })}
            placeholder="Nom"
            placeholderTextColor={colors.inkMuted}
            maxLength={NAME_MAX_LENGTH}
            accessibilityLabel="Nom"
            style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={{ color: colors.inkMuted }}>Vous êtes</Text>
        <View style={styles.pillRow}>
          {MEMBER_TYPES.map((option) => {
            const active = memberType === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => edit({ memberType: option.value })}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.accentText : colors.ink, fontWeight: "600" }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || !canSave}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.accent,
            opacity: pressed || mutation.isPending || !canSave ? 0.6 : 1,
            transform: [{ scale: pressed && !mutation.isPending && canSave ? 0.97 : 1 }],
          },
        ]}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 16 }}>Enregistrer</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 24, flexGrow: 1 },
  form: { gap: 20 },
  nameRow: { flexDirection: "row", gap: 12 },
  nameField: { flex: 1 },
  field: { gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
