import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/colors";

type LogoProps = { size?: number; textSize?: number; color?: string };

/**
 * Same brand mark as the web app's own `src/components/logo.tsx`: a
 * surveyor's benchmark / reticle, not a map-pin teardrop — "repère" is
 * French for a reference point, and cartography marks one with exactly this
 * crosshair-in-a-circle symbol. Built from plain `View`s (a geometric
 * approximation of the web's SVG path, not a pixel-identical copy — no
 * `react-native-svg` dependency added for one small icon; ask if true SVG
 * fidelity is wanted later) so it themes for free with `color`.
 */
function LogoMark({ size = 22, color }: { size: number; color: string }) {
  const ringDiameter = size * 0.5;
  const ringWidth = Math.max(1.3, size * 0.07);
  const dotSize = Math.max(2, size * 0.12);
  const tickLength = size * 0.2;
  const tickThickness = Math.max(1.3, size * 0.07);

  const tickBase = { position: "absolute" as const, backgroundColor: color, borderRadius: tickThickness / 2 };

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: ringDiameter,
          height: ringDiameter,
          borderRadius: ringDiameter / 2,
          borderWidth: ringWidth,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        }}
      />
      {/* Four ticks, one per side, with a gap before the ring — same layout as the web mark. */}
      <View style={[tickBase, { top: 0, left: (size - tickThickness) / 2, width: tickThickness, height: tickLength }]} />
      <View style={[tickBase, { bottom: 0, left: (size - tickThickness) / 2, width: tickThickness, height: tickLength }]} />
      <View style={[tickBase, { left: 0, top: (size - tickThickness) / 2, height: tickThickness, width: tickLength }]} />
      <View style={[tickBase, { right: 0, top: (size - tickThickness) / 2, height: tickThickness, width: tickLength }]} />
    </View>
  );
}

export function Logo({ size = 22, textSize = 18, color }: LogoProps) {
  const colors = useColors();
  const tone = color ?? colors.ink;
  return (
    <View style={styles.row}>
      <LogoMark size={size} color={tone} />
      {/* Fraunces Medium, not bold — matches the web wordmark exactly
          (`logo.tsx` there: "font-display text-lg font-medium"). An
          explicit lineHeight (not just fontSize) matters here: on the
          Réserver tab, a `SegmentedControl` sits right below with its own
          background right after a small `gap` — without extra breathing
          room, Fraunces's own glyph metrics (taller than the system font at
          the same fontSize) let that background paint over the wordmark's
          last letter. */}
      <Text
        style={{ color: tone, fontSize: textSize, lineHeight: textSize * 1.35, fontFamily: "Fraunces_500Medium" }}
      >
        Repère
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
});
