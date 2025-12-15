import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";

import { Iridescence } from "@/components/iridescence";
import { PulsingMicButton } from "@/components/pulsing-mic-button";
import { ModeButton, Select, StatCard } from "@/components/ui";
import { useUser } from "@/context/user-context";

type Mode = "pitch" | "interview";
type PitchType = "startup" | "product" | "yourself";
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
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("pitch");
  const [pitchType, setPitchType] = useState<PitchType>("startup");
  const [interviewType, setInterviewType] = useState<InterviewType>("external");
  const [selectOpen, setSelectOpen] = useState(false);

  // Mock stats - would come from user data
  const streak = 3;
  const avgScore = 8.5;

  const handleRecordPress = () => {};

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
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      >
        <YStack flex={1} paddingHorizontal="$5" paddingTop={insets.top + 12}>
          {/* Header */}
          <XStack alignItems="center" gap="$3" marginBottom="$6">
            <View style={styles.iridescenceContainer}>
              <Iridescence
                amplitude={0.5}
                speed={1.2}
                color={[0.35, 0.6, 1.0]}
              />
            </View>
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$gray11">
                {getGreeting(t)}
              </Text>
              <Text fontSize="$5" fontWeight="700" color="$color">
                {userData.name || "Alex"}
              </Text>
            </YStack>
          </XStack>

          {/* Title Section */}
          <YStack marginBottom="$6">
            <Text
              fontSize={32}
              fontWeight="700"
              color="$color"
              lineHeight={38}
              letterSpacing={-0.5}
            >
              {t("home.title")}
            </Text>
            <Text fontSize="$4" color="$gray11" marginTop="$2">
              {t("home.subtitle")}
            </Text>
          </YStack>

          {/* Stats Row */}
          <XStack gap="$3" marginBottom="$6">
            <StatCard
              icon="local-fire-department"
              iconColor="#22c55e"
              iconBgColor="rgba(34, 197, 94, 0.15)"
              label={t("home.stats.streak")}
              value={`${streak} ${t("home.stats.days")}`}
            />
            <StatCard
              icon="analytics"
              iconColor="#a855f7"
              iconBgColor="rgba(168, 85, 247, 0.15)"
              label={t("home.stats.avgScore")}
              value={`${avgScore}/10`}
            />
          </XStack>

          {/* Mode Selection */}
          <YStack marginBottom="$6">
            <Text
              fontSize="$2"
              fontWeight="600"
              color="$color"
              marginBottom="$3"
              textTransform="uppercase"
              letterSpacing={1}
              opacity={0.8}
            >
              {t("home.mode.title")}
            </Text>
            <XStack gap="$3" flexWrap="wrap">
              <ModeButton
                label={t("home.mode.pitch")}
                selected={mode === "pitch"}
                onPress={() => setMode("pitch")}
              />
              <ModeButton
                label={t("home.mode.interview")}
                selected={mode === "interview"}
                onPress={() => setMode("interview")}
              />
            </XStack>
          </YStack>

          {/* Conditional Options Based on Mode */}
          {mode === "pitch" ? (
            <YStack marginBottom="$4">
              <Text
                fontSize="$2"
                fontWeight="600"
                color="$color"
                marginBottom="$3"
                textTransform="uppercase"
                letterSpacing={1}
                opacity={0.8}
              >
                {t("home.pitchAbout.title")}
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <ModeButton
                  label={t("home.pitchAbout.startup")}
                  selected={pitchType === "startup"}
                  onPress={() => setPitchType("startup")}
                />
                <ModeButton
                  label={t("home.pitchAbout.product")}
                  selected={pitchType === "product"}
                  onPress={() => setPitchType("product")}
                />
                <ModeButton
                  label={t("home.pitchAbout.yourself")}
                  selected={pitchType === "yourself"}
                  onPress={() => setPitchType("yourself")}
                />
              </XStack>
            </YStack>
          ) : (
            <YStack marginBottom="$4">
              <Text
                fontSize="$2"
                fontWeight="600"
                color="$color"
                marginBottom="$3"
                textTransform="uppercase"
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
          )}
        </YStack>

        {/* Record Button Section - Pushed to bottom */}
        <YStack
          alignItems="center"
          paddingVertical="$8"
          paddingBottom="$10"
          marginTop="auto"
          paddingHorizontal="$5"
        >
          <PulsingMicButton onPress={handleRecordPress} />
          <YStack alignItems="center" marginTop="$4">
            <Text fontSize="$5" fontWeight="700" color="$color">
              {t("home.record.title")}
            </Text>
            <Text
              fontSize="$1"
              color="$gray11"
              marginTop="$1"
              fontWeight="500"
              letterSpacing={0.5}
            >
              {t("home.record.subtitle")}
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
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
