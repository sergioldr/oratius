import { config } from "@tamagui/config/v3";
import { createFont, createTamagui } from "tamagui";

// Dark theme background colors (from Tailwind design)
const BACKGROUND_DARK = "#101322";
const CARD_DARK = "rgba(31, 41, 55, 0.5)"; // gray-800 at 50% opacity
const BORDER_DARK = "rgba(55, 65, 81, 0.5)"; // gray-700 at 50% opacity
const BUTTON_BACKGROUND_DARK = "rgba(31, 41, 55, 0.5)"; // gray-800 at 50% opacity
const COLOR_DARK = "#ffffff";

// Light theme colors
const BACKGROUND_LIGHT = "#f5f6f8";
const CARD_LIGHT = "#ffffff";
const BORDER_LIGHT = "#e5e7eb";
const BORDER_LIGHT_HOVER = "#d1d5db";
const COLOR_LIGHT = "#111218";
const BUTTON_BACKGROUND_LIGHT = "#ffffff";
const BUTTON_BACKGROUND_LIGHT_HOVER = "#f9fafb";

const montserratFont = createFont({
  family: "Montserrat",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 44,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
  },
  lineHeight: {
    1: 15,
    2: 17,
    3: 18,
    4: 20,
    5: 22,
    6: 25,
    7: 28,
    8: 33,
    9: 41,
    10: 55,
    11: 67,
    12: 75,
    13: 87,
    14: 111,
    15: 137,
    16: 161,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
  },
  letterSpacing: {
    4: 0,
    5: 0,
    6: -0.5,
    7: -0.5,
    8: -1,
    9: -1.5,
  },
  face: {
    400: { normal: "Montserrat_400Regular" },
    500: { normal: "Montserrat_500Medium" },
    600: { normal: "Montserrat_600SemiBold" },
    700: { normal: "Montserrat_700Bold" },
  },
});

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
    heading: montserratFont,
    body: montserratFont,
  },
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      // Primary color scale - #2547f4 (from Tailwind design)
      primary1: "#eef2ff",
      primary2: "#e0e7ff",
      primary3: "#c7d2fe",
      primary4: "#a5b4fc",
      primary5: "#818cf8",
      primary6: "#2547f4", // Main primary
      primary7: "#1e3dd4",
      primary8: "#1a35b8",
      primary9: "#162d9c",
      primary10: "#122580",
      primary11: "#0e1d64",
      primary12: "#0a1548",
      // Gray scale for dark mode
      gray1: "#f9fafb",
      gray2: "#f3f4f6",
      gray3: "#e5e7eb",
      gray4: "#d1d5db",
      gray5: "#9ca3af",
      gray6: "#6b7280",
      gray7: "#4b5563",
      gray8: "#374151",
      gray9: "#1f2937",
      gray10: "#111827",
      gray11: "#9ca3af", // For secondary text
      gray12: "#f9fafb",
      // Background colors
      cardDark: CARD_DARK,
      borderDark: BORDER_DARK,
    },
  },
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      background: BACKGROUND_DARK,
      backgroundStrong: BACKGROUND_DARK,
      backgroundHover: BACKGROUND_DARK,
      backgroundPress: BACKGROUND_DARK,
      backgroundFocus: BACKGROUND_DARK,
      card: CARD_DARK,
      cardBackground: CARD_DARK,
      cardBorder: BORDER_DARK,
      color: COLOR_DARK,
      colorHover: COLOR_DARK,
      colorPress: COLOR_DARK,
      borderColor: BORDER_DARK,
      borderColorHover: BORDER_DARK,
      borderColorFocus: BORDER_DARK,
      borderColorPress: BORDER_DARK,
      // Button colors
      buttonBackground: BUTTON_BACKGROUND_DARK,
      buttonBorderColor: BORDER_DARK,
      buttonBackgroundHover: BUTTON_BACKGROUND_DARK,
      buttonBackgroundPress: BUTTON_BACKGROUND_DARK,
      // Switch colors
      switchBackground: BORDER_DARK,
      switchBorderColor: BORDER_DARK,
    },
    light: {
      ...config.themes.light,
      background: BACKGROUND_LIGHT,
      backgroundStrong: BACKGROUND_LIGHT,
      backgroundHover: BACKGROUND_LIGHT,
      backgroundPress: BACKGROUND_LIGHT,
      backgroundFocus: BACKGROUND_LIGHT,
      card: CARD_LIGHT,
      cardBackground: CARD_LIGHT,
      cardBorder: BORDER_LIGHT,
      color: COLOR_LIGHT,
      colorHover: COLOR_LIGHT,
      colorPress: COLOR_LIGHT,
      borderColor: BORDER_LIGHT,
      borderColorHover: BORDER_LIGHT_HOVER,
      borderColorFocus: BORDER_LIGHT_HOVER,
      borderColorPress: BORDER_LIGHT,
      // Button colors
      buttonBackground: BUTTON_BACKGROUND_LIGHT,
      buttonBorderColor: BORDER_LIGHT,
      buttonBackgroundHover: BUTTON_BACKGROUND_LIGHT_HOVER,
      buttonBackgroundPress: BUTTON_BACKGROUND_LIGHT,
      // Switch colors
      switchBackground: BORDER_LIGHT,
      switchBorderColor: BORDER_LIGHT,
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
