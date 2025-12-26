import { Href, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { Iridescence } from "@/components/iridescence";
import { PulsingMicButton } from "@/components/pulsing-mic-button";
import { HeroStreakCard, Select, StatCard } from "@/components/ui";
import { useUser } from "@/context/user-context";
import { useAudioPermission } from "@/hooks/use-audio-permission";
import { useAuthMe } from "@/hooks/use-auth-me";
import { useProfileStore } from "@/store/profile-store";

type InterviewType =
  | "external"
  | "internal"
  | "behavioral"
  | "technical"
  | "panel"
  | "other";

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("home.greeting.morning");
  if (hour < 18) return t("home.greeting.afternoon");
  return t("home.greeting.evening");
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userData } = useUser();
  const { profile } = useProfileStore();
  const insets = useSafeAreaInsets();

  const [interviewType, setInterviewType] = useState<InterviewType>("external");
  const [selectOpen, setSelectOpen] = useState(false);

  const { requestPermission } = useAudioPermission();

  // Fetch current user from API server (logs result automatically)
  useAuthMe();

  // Mock stats - would come from user data
  const streak = 3;
  const avgScore = 8.5;
  const confidence = "High";
  const clarity = 92;
  const structure = "Solid";

  const handleRecordPress = async () => {
    const hasPermission = await requestPermission();

    if (hasPermission) {
      router.push(`/record-voice?mode=interview&type=${interviewType}` as Href);
    }
  };

  const interviewOptions: { value: InterviewType; label: string }[] = [
    { value: "external", label: t("home.interviewType.external") },
    { value: "internal", label: t("home.interviewType.internal") },
    { value: "behavioral", label: t("home.interviewType.behavioral") },
    { value: "technical", label: t("home.interviewType.technical") },
    { value: "panel", label: t("home.interviewType.panel") },
    { value: "other", label: t("home.interviewType.other") },
  ];

  return (
    <YStack flex={1} backgroundColor="$backgroundStrong">
      <YStack
        flex={1}
        paddingHorizontal="$4"
        paddingTop={insets.top + 8}
        paddingBottom={Math.max(insets.bottom, 20) + 80}
        justifyContent="space-between"
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack alignItems="center" gap="$2" marginBottom="$3">
            <View style={styles.iridescenceContainer}>
              <Iridescence
                amplitude={0.5}
                speed={1.2}
                color={[0.35, 0.6, 1.0]}
              />
            </View>
            <YStack>
              <Text fontSize="$2" fontWeight="500" color="$gray11">
                {getGreeting(t)}
              </Text>
              <Text fontSize="$4" fontWeight="700" color="$color">
                {profile.name || "Alex"}
              </Text>
            </YStack>
          </XStack>

          {/* Title Section */}
          <YStack marginTop="$3" marginBottom="$3">
            <Text
              fontSize={26}
              fontWeight="700"
              color="$color"
              lineHeight={32}
              letterSpacing={-0.5}
            >
              {t("home.title")}
            </Text>
          </YStack>

          {/* Hero Streak Card */}
          <YStack marginBottom="$3">
            <HeroStreakCard
              streak={streak}
              label={t("home.stats.currentStreak")}
              daysLabel={t("home.stats.days")}
            />
          </YStack>

          {/* Stats Grid */}
          <YStack gap="$2" marginBottom="$3">
            <XStack gap="$2">
              <StatCard
                icon="analytics"
                iconColor="#a855f7"
                iconBgColor="rgba(168, 85, 247, 0.15)"
                label={t("home.stats.avgScore")}
                value={`${avgScore}/10`}
              />
              <StatCard
                icon="happy"
                iconColor="#3b82f6"
                iconBgColor="rgba(59, 130, 246, 0.15)"
                label={t("home.stats.confidence")}
                value={confidence}
              />
            </XStack>
            <XStack gap="$2">
              <StatCard
                icon="pulse"
                iconColor="#f59e0b"
                iconBgColor="rgba(245, 158, 11, 0.15)"
                label={t("home.stats.clarity")}
                value={`${clarity}%`}
              />
              <StatCard
                icon="document-text"
                iconColor="#8b5cf6"
                iconBgColor="rgba(139, 92, 246, 0.15)"
                label={t("home.stats.structure")}
                value={structure}
              />
            </XStack>
          </YStack>

          {/* Interview Type Selection */}
          <YStack marginTop="$3" marginBottom="$3">
            <Text
              fontSize="$1"
              fontWeight="600"
              color="$color"
              marginBottom="$2"
              letterSpacing={1}
              opacity={0.8}
            >
              {t("home.interviewType.title")}
            </Text>
            <Select
              value={interviewType}
              options={interviewOptions}
              onValueChange={setInterviewType}
              open={selectOpen}
              onOpenChange={setSelectOpen}
            />
          </YStack>
        </YStack>

        {/* Record Button Section */}
        <YStack alignItems="center" marginTop="$4">
          <PulsingMicButton onPress={handleRecordPress} />
          <YStack alignItems="center" marginTop="$4">
            <Text
              fontSize="$1"
              fontWeight="600"
              color="$color"
              letterSpacing={1}
              opacity={0.8}
            >
              {t("home.record.title")}
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  iridescenceContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
});
