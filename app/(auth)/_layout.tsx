import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Platform } from "react-native";
import { YStack } from "tamagui";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { useAuth } from "@/context/auth-context";

/**
 * Layout for authenticated screens
 * Uses Stack navigation with full screen modal for record-voice
 * Falls back to custom BottomTabBar on non-iOS platforms
 * Redirects to index if user is not authenticated
 */
export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  // Show loading indicator while checking authentication state
  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" />
      </YStack>
    );
  }

  // Redirect to welcome screen if not authenticated
  if (!session) {
    return <Redirect href="/" />;
  }

  // Use Stack navigation on iOS
  if (Platform.OS === "ios") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="record-voice"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack>
    );
  }

  // Fallback for Android and other platforms using custom BottomTabBar
  return (
    <YStack flex={1}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen
          name="record-voice"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack>
      <BottomTabBar />
    </YStack>
  );
}
