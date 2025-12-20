import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, useColorScheme } from "react-native";
import { YStack } from "tamagui";

import { getDefaultScreenOptions } from "@/constants/navigation";
import { useAuth } from "@/context/auth-context";
import React from "react";

/**
 * Layout for authenticated screens
 * Uses Stack navigation with full screen modal for record-voice
 * Redirects to index if user is not authenticated
 */
export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const screenOptions = getDefaultScreenOptions(colorScheme);

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

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="record-voice"
        options={{
          presentation: "fullScreenModal",
          animation: "fade",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="recording-error"
        options={{
          presentation: "fullScreenModal",
          animation: "none",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="processing-recording"
        options={{
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
