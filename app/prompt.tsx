import { router } from "expo-router";
import { Card, Text, YStack } from "tamagui";

import { PrimaryButton, ScreenContainer } from "@/components/ui";

export default function PromptScreen() {
  const handleStartRecording = () => {
    router.push("/recording");
  };

  return (
    <ScreenContainer>
      <YStack flex={1} justifyContent="center" gap="$6" paddingHorizontal="$2">
        <Text fontSize="$7" fontWeight="bold" color="$color">
          Exercise 1 of 3
        </Text>

        <Card bordered padding="$5" borderRadius="$4">
          <YStack gap="$3">
            <Text fontSize="$3" color="$gray11" textTransform="uppercase">
              Prompt
            </Text>
            <Text fontSize="$5" color="$color" lineHeight="$3">
              Tell me about yourself in 30 seconds.
            </Text>
          </YStack>
        </Card>

        <PrimaryButton onPress={handleStartRecording}>
          Start recording
        </PrimaryButton>
      </YStack>
    </ScreenContainer>
  );
}
