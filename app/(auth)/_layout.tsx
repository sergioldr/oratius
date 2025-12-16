import { Redirect, Stack } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, DynamicColorIOS, Platform } from "react-native";
import { YStack } from "tamagui";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { useAuth } from "@/context/auth-context";

/**
 * Layout for authenticated screens
 * Uses NativeTabs for iOS native tab bar with Liquid Glass support (iOS 26+)
 * Falls back to custom BottomTabBar on other platforms
 * Redirects to index if user is not authenticated
 */
export default function AuthLayout() {
  const { t } = useTranslation();
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

  // Use NativeTabs on iOS for native tab bar with Liquid Glass support
  if (Platform.OS === "ios") {
    return (
      <NativeTabs
        labelStyle={{
          color: DynamicColorIOS({
            dark: "white",
            light: "black",
          }),
        }}
        tintColor={DynamicColorIOS({
          dark: "white",
          light: "black",
        })}
      >
        <NativeTabs.Trigger name="feedback">
          <Icon sf={{ default: "text.bubble", selected: "text.bubble.fill" }} />
          <Label>{t("home.tabs.feedback")}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="home">
          <Icon sf={{ default: "waveform", selected: "waveform" }} />
          <Label>{t("home.tabs.practice")}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person", selected: "person.fill" }} />
          <Label>{t("home.tabs.profile")}</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Fallback for Android and other platforms using custom BottomTabBar
  return (
    <YStack flex={1}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
      </Stack>
      <BottomTabBar />
    </YStack>
  );
}
