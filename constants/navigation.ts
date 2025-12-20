import { Colors } from "./theme";

/**
 * Get default screen options for Stack navigators with themed header styles
 * @param colorScheme - Current color scheme ('light' or 'dark')
 * @returns Stack navigation options with themed header styles
 */
export function getDefaultScreenOptions(
  colorScheme: "light" | "dark" | null | undefined
) {
  const textColor = Colors[colorScheme ?? "light"].text;

  return {
    headerShown: false,
    headerTitleStyle: {
      color: textColor,
      fontFamily: "Montserrat_600SemiBold",
    },
    headerTintColor: textColor,
  };
}
