import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { Roboto_500Medium } from "@expo-google-fonts/roboto";
import { MaterialIcons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable } from "react-native";
import "react-native-reanimated";
import { TamaguiProvider, Theme } from "tamagui";

import { AuthProvider } from "@/context/auth-context";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/locales";
import config from "../tamagui.config";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore error if splash screen is not registered for the view controller
        // This can happen with modal presentations on iOS
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthProvider>
            <UserProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ title: "" }} />
                <Stack.Screen
                  name="login"
                  options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: "",
                    headerBackTitle: "",
                    headerBackButtonDisplayMode: "minimal",
                  }}
                />
                <Stack.Screen
                  name="signup"
                  options={{
                    presentation: "modal",
                    headerShown: true,
                    headerTitle: "",
                    headerTransparent: true,
                    headerRight: () => (
                      <Pressable onPress={() => router.back()} hitSlop={10}>
                        <MaterialIcons
                          name="close"
                          size={28}
                          color="white"
                          style={{ opacity: 0.8, paddingLeft: 4.5 }}
                        />
                      </Pressable>
                    ),
                  }}
                />
                <Stack.Screen name="(auth)" />
              </Stack>
              <StatusBar style="auto" />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}
