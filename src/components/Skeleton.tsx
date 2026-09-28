import { useEffect, useState } from "react";
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/theme/colors";

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

// One placeholder block that pulses while data loads — shown instead of a
// spinner so the screen keeps its shape (see `mobile-design`, "Every data
// screen has four states"). Plain `Animated` on the native driver: no
// animation library (decision in CLAUDE.md, "Décisions actées").
export function Skeleton({ width = "100%", height, radius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity }, style]}
    />
  );
}
