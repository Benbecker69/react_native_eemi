import { useColorScheme } from "react-native";

// Light continuity with the web app's own palette (its `layout.tsx`: paper
// `#ededea` / dark `#14171a`, a dark-green CTA) — see CLAUDE.md "Identité".
// System typography and native iOS components otherwise; this file only
// owns color, so no hex is hardcoded in a screen.
const palette = {
  light: {
    background: "#ededea",
    surface: "#ffffff",
    ink: "#14171a",
    inkMuted: "#6b6f76",
    accent: "#2d5744",
    accentText: "#ffffff",
    border: "#d8d6d0",
    danger: "#b3261e",
  },
  dark: {
    background: "#14171a",
    surface: "#1d2125",
    ink: "#ededea",
    inkMuted: "#9aa0a6",
    accent: "#7fb69a",
    accentText: "#0b1210",
    border: "#2c3136",
    danger: "#ff6b60",
  },
} as const;

export type Colors = {
  background: string;
  surface: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentText: string;
  border: string;
  danger: string;
};

export function useColors(): Colors {
  const scheme = useColorScheme();
  return palette[scheme === "dark" ? "dark" : "light"];
}
