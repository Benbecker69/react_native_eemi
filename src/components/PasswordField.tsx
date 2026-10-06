import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** "current-password" for re-authenticating, "new-password" when setting one — lets iOS offer the right autofill/strength UI. */
  autoComplete?: "current-password" | "new-password";
};

// A password input with a show/hide toggle (an eye icon, the standard way
// to let someone check what they just typed before submitting) — used
// everywhere the Sécurité screen asks for a password. Login/register keep
// their own plain `secureTextEntry` field: this one earns its place by being
// reused three times on one screen (current, new, confirm).
export function PasswordField({ label, value, onChangeText, placeholder, autoComplete = "current-password" }: PasswordFieldProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={{ color: colors.inkMuted }}>{label}</Text>
      <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={autoComplete === "new-password" ? "newPassword" : "password"}
          accessibilityLabel={label}
          style={[styles.input, { color: colors.ink }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}
        >
          <SymbolView name={visible ? "eye.slash" : "eye"} tintColor={colors.inkMuted} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  toggle: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
