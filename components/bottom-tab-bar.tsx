import { MaterialIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

interface TabItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

function TabItem({ icon, label, active = false, onPress }: TabItemProps) {
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      gap="$1"
      padding="$2"
      opacity={active ? 1 : 0.6}
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon}
        size={26}
        color={active ? "#3b82f6" : "#9ca3af"}
      />
      <Text
        fontSize={10}
        fontWeight={active ? "600" : "500"}
        color={active ? "$primary6" : "$gray10"}
      >
        {label}
      </Text>
    </YStack>
  );
}

export function BottomTabBar() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Don't render on welcome/index screen
  if (pathname === "/" || pathname === "/index") {
    return null;
  }

  const tabs = [
    {
      icon: "show-chart" as const,
      label: t("home.tabs.feedback"),
      path: "/feedback",
    },
    {
      icon: "graphic-eq" as const,
      label: t("home.tabs.practice"),
      path: "/home",
    },
    {
      icon: "person" as const,
      label: t("home.tabs.profile"),
      path: "/profile",
    },
  ];

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingBottom={insets.bottom + 8}
      paddingTop="$2"
      justifyContent="space-around"
      alignItems="center"
      paddingHorizontal="$5"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.path}
          icon={tab.icon}
          label={tab.label}
          active={pathname === tab.path}
          onPress={() => router.push(tab.path as any)}
        />
      ))}
    </XStack>
  );
}
