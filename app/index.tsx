import { router } from "expo-router";
import { Text, YStack } from "tamagui";

import { ScreenContainer, SecondaryButton, StarBorder } from "@/components/ui";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/name");
  };

  const handleLogin = () => {
    // TODO: Implement login flow
    console.log("Login pressed - to be implemented");
  };

  return (
    <ScreenContainer centered>
      <YStack alignItems="center" gap="$6" paddingHorizontal="$4">
        <YStack alignItems="center" gap="$3">
          <Text fontSize="$10" fontWeight="bold" color="$color">
            Oratory Coach
          </Text>
          <Text
            fontSize="$5"
            color="$gray11"
            textAlign="center"
            lineHeight="$2"
          >
            AI-powered training for confident speaking.
          </Text>
        </YStack>

        <YStack gap="$3" width="100%" maxWidth={300}>
          <StarBorder color="#3b82f6" speed={6000} onPress={handleGetStarted}>
            <Text textAlign="center" width="100%">
              Get started
            </Text>
          </StarBorder>

          <SecondaryButton onPress={handleLogin}>
            I already have an account
          </SecondaryButton>
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
