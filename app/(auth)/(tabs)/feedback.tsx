import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { ThemedScreenContainer } from "@/components/ui/themed-screen-container";

/**
 * Feedback screen - Shows user's practice feedback and progress
 */
export default function FeedbackScreen() {
  const { t } = useTranslation();

  return (
    <ThemedScreenContainer>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          {t("home.tabs.feedback")}
        </Text>
        <Text fontSize="$4" color="$gray11" marginTop="$2">
          Your feedback and progress will appear here
        </Text>
      </YStack>
    </ThemedScreenContainer>
  );
}
