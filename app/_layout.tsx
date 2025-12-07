import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { TamaguiProvider, Theme } from "tamagui";

import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import config from "../tamagui.config";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <UserProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="name" />
              <Stack.Screen name="goal" />
              <Stack.Screen name="home" />
              <Stack.Screen name="prompt" />
              <Stack.Screen name="recording" />
              <Stack.Screen name="feedback" />
            </Stack>
            <StatusBar style="auto" />
          </UserProvider>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}
