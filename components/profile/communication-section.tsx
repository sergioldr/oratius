import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { Card, Select } from "@/components/ui";

import type { Language, SpeakingContext } from "./types";

interface CommunicationSectionProps {
  speakingContext: SpeakingContext;
  language: Language;
  onSpeakingContextChange: (value: SpeakingContext) => void;
  onLanguageChange: (value: Language) => void;
}

/**
 * Communication section with speaking context and language preferences
 */
export function CommunicationSection({
  speakingContext,
  language,
  onSpeakingContextChange,
  onLanguageChange,
}: CommunicationSectionProps) {
  const { t } = useTranslation();

  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const SPEAKING_CONTEXTS: { value: SpeakingContext; label: string }[] = [
    {
      value: "executive-meetings",
      label: t("profile.speakingContext.executiveMeetings"),
    },
    { value: "interviews", label: t("profile.speakingContext.interviews") },
    { value: "pitches", label: t("profile.speakingContext.pitches") },
    { value: "daily-team", label: t("profile.speakingContext.dailyTeam") },
  ];

  const LANGUAGES: { value: Language; label: string }[] = [
    { value: "en-US", label: t("profile.language.enUs") },
    { value: "en-GB", label: t("profile.language.enGb") },
    { value: "es-ES", label: t("profile.language.es") },
  ];

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="bold" color="$color">
        {t("profile.communication.title")}
      </Text>

      <Card variant="elevated" padding="$4" gap="$4">
        {/* Speaking Context */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {t("profile.speakingContext.title")}
          </Text>

          <Select
            value={speakingContext}
            options={SPEAKING_CONTEXTS}
            onValueChange={onSpeakingContextChange}
            placeholder={t("profile.speakingContext.placeholder")}
            open={contextSheetOpen}
            onOpenChange={setContextSheetOpen}
          />
        </YStack>

        {/* Language */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {t("profile.language.title")}
          </Text>

          <Select
            value={language}
            options={LANGUAGES}
            onValueChange={onLanguageChange}
            placeholder={t("profile.language.placeholder")}
            open={languageSheetOpen}
            onOpenChange={setLanguageSheetOpen}
          />
        </YStack>
      </Card>
    </YStack>
  );
}
