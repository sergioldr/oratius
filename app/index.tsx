import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, XStack, YStack } from "tamagui";

import {
  FeatureCard,
  GhostButton,
  PrimaryButton,
  ThemedScreenContainer,
} from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";
import { useAuth } from "@/context/auth-context";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { session, isLoading, signInAnonymously } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGetStarted = useCallback(async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      await signInAnonymously();
      router.replace("/(auth)/home");
    } catch (error) {
      console.error("Failed to sign in anonymously:", error);
      // TODO: Show error toast/alert to user
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn, signInAnonymously]);

  // Redirect to home if user already has a session
  if (!isLoading && session) {
    return <Redirect href="/(auth)/home" />;
  }

  const handleLogin = () => {
    router.push("/login");
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
          <PrimaryButton
            onPress={handleGetStarted}
            isLoading={isSigningIn || isLoading}
            iconRight="arrow-forward"
          >
            {t("welcome.getStarted")}
          </PrimaryButton>

          {/* Login Link */}
          <XStack justifyContent="center" alignItems="center" gap="$1">
            <Text fontSize="$4" color="$gray11" fontWeight="600">
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
