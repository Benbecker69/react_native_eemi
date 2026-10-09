import { useColorScheme } from "react-native";

// The real palette of the web app's `src/app/globals.css` (its `:root` /
// `@media (prefers-color-scheme: dark)` tokens, --ink/--pine/--ochre/...),
// read directly from source, so both apps share one identity. `ochre` is
// the web's secondary accent
// ("alerte/places limitées" — busy/warning states), not used here before.
const palette = {
  light: {
    background: "#ededea",
    surface: "#ffffff",
    ink: "#171b1f",
    inkMuted: "#5b6168",
    accent: "#24534a",
    accentText: "#f4f6f5",
    ochre: "#8f5a26",
    ochreText: "#fdf8f1",
    border: "#d8d4c9",
    danger: "#a3372a",
    skeleton: "#dcdad4",
  },
  dark: {
    background: "#14171a",
    surface: "#1d211f",
    ink: "#edeeea",
    inkMuted: "#9aa0a6",
    accent: "#4c9c8b",
    accentText: "#0e1a17",
    ochre: "#d69a57",
    ochreText: "#241505",
    border: "#2c322f",
    danger: "#e07a68",
    skeleton: "#2a3035",
  },
} as const;

export type Colors = {
  background: string;
  surface: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentText: string;
  /** Secondary accent (web's `--ochre`) — busy/warning states, used sparingly. */
  ochre: string;
  ochreText: string;
  border: string;
  danger: string;
  /** Placeholder blocks shown while data loads. */
  skeleton: string;
};

export function useColors(): Colors {
  const scheme = useColorScheme();
  return palette[scheme === "dark" ? "dark" : "light"];
}
