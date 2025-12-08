import { router } from "expo-router";
import { Text, YStack } from "tamagui";

import { ScreenContainer, SecondaryButton, StarBorder } from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";

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
      <YStack alignItems="center" gap="$6" paddingHorizontal="$4" width="100%">
        <VoiceOrb
          isRecording={false}
          glowOpacity={0.3}
          scale={1}
          amplitude={0.3}
          speed={1}
          orbColor={[0.23, 0.51, 0.96]}
        />

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

        <YStack gap="$3" width="100%" alignSelf="stretch">
          <StarBorder color="#cfc7fa" speed={6000} onPress={handleGetStarted}>
            Get started
          </StarBorder>

          <SecondaryButton onPress={handleLogin}>
            I already have an account
          </SecondaryButton>
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
