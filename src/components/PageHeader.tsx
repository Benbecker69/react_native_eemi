import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";
import { Logo } from "@/components/Logo";

type PageHeaderProps = { title: string; description?: string };

// The top of each of the three root tabs (Réserver, Historique, Profil):
// the brand mark stays visible at every "home base" of the app (not
// repeated on pushed screens, which already have a native back button
// establishing context), then the page's own
// title in Fraunces, matching the web's own `font-display text-2xl
// font-medium` h1 treatment exactly.
export function PageHeader({ title, description }: PageHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Logo size={20} textSize={16} />
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      {description ? <Text style={{ color: colors.inkMuted }}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  title: { fontSize: 28, fontFamily: "Fraunces_500Medium" },
});
