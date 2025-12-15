import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { ThemedScreenContainer } from "@/components/ui/themed-screen-container";

/**
 * Profile screen - User profile and settings
 */
export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <ThemedScreenContainer>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          {t("home.tabs.profile")}
        </Text>
        <Text fontSize="$4" color="$gray11" marginTop="$2">
          Your profile and settings will appear here
        </Text>
      </YStack>
    </ThemedScreenContainer>
  );
}
