import { config } from "@tamagui/config/v3";
import { createFont, createTamagui } from "tamagui";

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
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
