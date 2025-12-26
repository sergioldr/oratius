import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { Card, Select } from "@/components/ui";

import type { Language } from "./types";

interface CommunicationSectionProps {
  language: Language;
  onLanguageChange: (value: Language) => void;
}

/**
 * Communication section with speaking context and language preferences
 */
export function CommunicationSection({
  language,
  onLanguageChange,
}: CommunicationSectionProps) {
  const { t } = useTranslation();

  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

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
        {/* Language */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
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
