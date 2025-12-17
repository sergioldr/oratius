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
import * as SplashScreenExpo from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import "react-native-reanimated";
import { TamaguiProvider, Theme } from "tamagui";

import { SplashScreen } from "@/components/splash-screen";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/locales";
import config from "../tamagui.config";

// Prevent native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

/**
 * Root layout component that wraps the entire app with providers.
 * Handles font loading and theme configuration.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_500Medium,
  });

  // Hide native splash screen once main fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenExpo.hideAsync().catch(() => {
        // Ignore error if splash screen is not registered for the view controller
        // This can happen with modal presentations on iOS
      });
    }
  }, [fontsLoaded]);

  // Don't render anything until main fonts are loaded
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
              <AppContent colorScheme={colorScheme} />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}

interface AppContentProps {
  colorScheme: "light" | "dark" | null | undefined;
}

/**
 * App content component that handles auth state and shows custom splash screen.
 * This component must be inside AuthProvider to access auth context.
 */
function AppContent({ colorScheme }: AppContentProps) {
  const { isLoading: isAuthLoading, session } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashFontsReady, setIsSplashFontsReady] = useState(false);

  // Handle splash screen fonts being ready
  const handleSplashReady = useCallback(() => {
    setIsSplashFontsReady(true);
  }, []);

  // Check if app is fully ready (auth loaded + splash fonts loaded)
  useEffect(() => {
    if (!isAuthLoading && isSplashFontsReady) {
      // small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, isSplashFontsReady]);

  // Navigate to appropriate screen once ready
  useEffect(() => {
    if (isAppReady) {
      if (session) {
        // User is authenticated, go to home
        router.replace("/(auth)/home");
      }
      // If no session, stay on index (welcome screen)
    }
  }, [isAppReady, session]);

  // Show custom splash screen while loading
  if (!isAppReady) {
    return <SplashScreen onReady={handleSplashReady} />;
  }

  return (
    <>
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
                  color={colorScheme === "dark" ? "white" : "black"}
                  style={{ opacity: 0.8, paddingLeft: 4.5 }}
                />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="(auth)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
