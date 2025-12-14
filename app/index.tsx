import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Text, XStack, YStack } from "tamagui";

import {
  FeatureCard,
  GhostButton,
  ThemedScreenContainer,
} from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";

export default function WelcomeScreen() {
  const { t } = useTranslation();

  const handleGetStarted = () => {
    router.push("/home");
  };

  const handleLogin = () => {
    // TODO: Implement login flow
    console.log("Login pressed - to be implemented");
  };

  return (
    <ThemedScreenContainer>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="space-between"
        paddingVertical="$4"
        width="100%"
        maxWidth={448}
        alignSelf="center"
      >
        {/* Top Section - Orb, Badge, Title, Features */}
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          width="100%"
        >
          {/* Voice Orb */}
          <YStack marginBottom="$6">
            <VoiceOrb
              isRecording={false}
              glowOpacity={0.6}
              scale={1}
              amplitude={0.5}
              speed={1.2}
              orbColor={[0.35, 0.6, 1.0]}
            />
          </YStack>

          {/* Title */}
          <Text
            fontSize="$8"
            fontWeight="700"
            textAlign="center"
            color="$color"
            marginBottom="$2"
            lineHeight="$8"
          >
            {t("welcome.title")}
          </Text>

          {/* Subtitle */}
          <Text
            fontSize="$4"
            textAlign="center"
            color="$gray11"
            marginBottom="$5"
            paddingHorizontal="$4"
            maxWidth={320}
            lineHeight="$4"
          >
            {t("welcome.subtitle")}
          </Text>

          {/* Feature Cards */}
          <YStack gap="$3" width="100%" marginBottom="$2">
            <FeatureCard
              icon="record-voice-over"
              title={t("welcome.features.practice.title")}
              description={t("welcome.features.practice.description")}
            />
            <FeatureCard
              icon="bolt"
              title={t("welcome.features.feedback.title")}
              description={t("welcome.features.feedback.description")}
            />
            <FeatureCard
              icon="show-chart"
              title={t("welcome.features.progress.title")}
              description={t("welcome.features.progress.description")}
            />
          </YStack>
        </YStack>

        {/* Bottom Section - CTA Buttons */}
        <YStack width="100%" paddingTop="$4" gap="$3">
          {/* Primary CTA Button */}
          <Button
            backgroundColor="$primary6"
            color="white"
            size="$5"
            borderRadius="$10"
            onPress={handleGetStarted}
            shadowColor="$primary6"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.25}
            shadowRadius={8}
            elevation={4}
          >
            <XStack alignItems="center" gap="$2">
              <Text color="white" fontSize="$5" fontWeight="600">
                {t("welcome.getStarted")}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </XStack>
          </Button>

          {/* Login Link */}
          <XStack justifyContent="center" alignItems="center" gap="$1">
            <Text fontSize="$4" color="$gray11">
              {t("welcome.loginPrompt")}
            </Text>
            <GhostButton onPress={handleLogin} size="$3" paddingHorizontal="$1">
              {t("welcome.login")}
            </GhostButton>
          </XStack>
        </YStack>
      </YStack>
    </ThemedScreenContainer>
  );
}
