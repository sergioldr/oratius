import { Stack } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";
import { YStack } from "tamagui";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { getDefaultScreenOptions } from "@/constants/navigation";
import { t } from "i18next";
import React from "react";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const screenOptions = getDefaultScreenOptions(colorScheme);

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

  return (
    <YStack flex={1}>
      <Stack screenOptions={{ ...screenOptions, headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="profile" />
      </Stack>
      <BottomTabBar />
    </YStack>
  );
}
