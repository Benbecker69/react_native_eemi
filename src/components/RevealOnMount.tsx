import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing } from "react-native";

// The one deliberate "page load" moment —
// mirrors the web's own `.animate-hero-reveal` (globals.css: fade in,
// settle up from a slight offset, `ease-out`, 0.6 s). Used once, on the
// login screen's hero — not a generic scroll-reveal reused on every card.
export function RevealOnMount({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(12));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}
