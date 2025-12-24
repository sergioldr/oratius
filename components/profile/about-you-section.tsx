import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { Card, Select } from "@/components/ui";

import type { Industry, Seniority, SpeakingRole } from "./types";

interface AboutYouSectionProps {
  speakingRole: SpeakingRole;
  industry: Industry;
  seniority: Seniority;
  onSpeakingRoleChange: (value: SpeakingRole) => void;
  onIndustryChange: (value: Industry) => void;
  onSeniorityChange: (value: Seniority) => void;
}

/**
 * About You section with role, industry, and seniority selection
 */
export function AboutYouSection({
  speakingRole,
  industry,
  seniority,
  onSpeakingRoleChange,
  onIndustryChange,
  onSeniorityChange,
}: AboutYouSectionProps) {
  const { t } = useTranslation();

  const [speakingRoleSheetOpen, setSpeakingRoleSheetOpen] = useState(false);
  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [senioritySheetOpen, setSenioritySheetOpen] = useState(false);

  const SPEAKING_ROLES: { value: SpeakingRole; label: string }[] = [
    { value: "leadership", label: t("profile.speakingRole.leadership") },
    {
      value: "people-management",
      label: t("profile.speakingRole.peopleManagement"),
    },
    { value: "engineering", label: t("profile.speakingRole.engineering") },
    {
      value: "product-project",
      label: t("profile.speakingRole.productProject"),
    },
    { value: "sales", label: t("profile.speakingRole.sales") },
    { value: "marketing-pr", label: t("profile.speakingRole.marketingPr") },
    {
      value: "customer-success",
      label: t("profile.speakingRole.customerSuccess"),
    },
    { value: "support", label: t("profile.speakingRole.support") },
    { value: "operations", label: t("profile.speakingRole.operations") },
    {
      value: "finance-accounting",
      label: t("profile.speakingRole.financeAccounting"),
    },
    { value: "consulting", label: t("profile.speakingRole.consulting") },
    { value: "founder", label: t("profile.speakingRole.founder") },
    { value: "hr-recruiting", label: t("profile.speakingRole.hrRecruiting") },
    {
      value: "education-training",
      label: t("profile.speakingRole.educationTraining"),
    },
    {
      value: "research-academia",
      label: t("profile.speakingRole.researchAcademia"),
    },
    { value: "healthcare", label: t("profile.speakingRole.healthcare") },
    { value: "legal", label: t("profile.speakingRole.legal") },
    { value: "public-sector", label: t("profile.speakingRole.publicSector") },
    { value: "creator", label: t("profile.speakingRole.creator") },
    { value: "other", label: t("profile.speakingRole.other") },
    { value: "prefer-not", label: t("profile.speakingRole.preferNot") },
  ];

  const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: "technology", label: t("profile.industry.technology") },
    { value: "finance", label: t("profile.industry.finance") },
    { value: "consulting", label: t("profile.industry.consulting") },
    { value: "healthcare", label: t("profile.industry.healthcare") },
    { value: "education", label: t("profile.industry.education") },
    { value: "government", label: t("profile.industry.government") },
    { value: "manufacturing", label: t("profile.industry.manufacturing") },
    { value: "retail", label: t("profile.industry.retail") },
    { value: "media", label: t("profile.industry.media") },
    { value: "nonprofit", label: t("profile.industry.nonprofit") },
    { value: "other", label: t("profile.industry.other") },
  ];

  const SENIORITIES: { value: Seniority; label: string }[] = [
    { value: "junior", label: t("profile.seniority.junior") },
    { value: "emerging", label: t("profile.seniority.emerging") },
    { value: "mid-level", label: t("profile.seniority.midLevel") },
    { value: "senior", label: t("profile.seniority.senior") },
    { value: "manager", label: t("profile.seniority.manager") },
    { value: "director", label: t("profile.seniority.director") },
    { value: "executive", label: t("profile.seniority.executive") },
  ];

  const handleWhyNeeded = () => {
    Alert.alert(
      t("profile.alerts.whyNeeded.title"),
      t("profile.alerts.whyNeeded.message"),
      [{ text: t("common.ok"), style: "default" }]
    );
  };

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="bold" color="$color">
          {t("profile.aboutYou.title")}
        </Text>
        <Pressable onPress={handleWhyNeeded}>
          <Text fontSize={10} color="$primary6" fontWeight="500">
            {t("profile.whyNeeded")}
          </Text>
        </Pressable>
      </XStack>

      <Card variant="elevated" padding="$4" gap="$4">
        {/* Speaking Role */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {t("profile.speakingRole.title")}
          </Text>

          <Select
            value={speakingRole}
            options={SPEAKING_ROLES}
            onValueChange={onSpeakingRoleChange}
            placeholder={t("profile.speakingRole.placeholder")}
            open={speakingRoleSheetOpen}
            onOpenChange={setSpeakingRoleSheetOpen}
            snapPoints={[75]}
          />
        </YStack>

        {/* Industry and Seniority */}
        <XStack gap="$3">
          <YStack flex={1} gap="$2">
            <Select
              value={industry}
              options={INDUSTRIES}
              onValueChange={onIndustryChange}
              placeholder={t("profile.industry.placeholder")}
              open={industrySheetOpen}
              onOpenChange={setIndustrySheetOpen}
            />
          </YStack>
          <YStack flex={1} gap="$2">
            <Select
              value={seniority}
              options={SENIORITIES}
              onValueChange={onSeniorityChange}
              placeholder={t("profile.seniority.placeholder")}
              open={senioritySheetOpen}
              onOpenChange={setSenioritySheetOpen}
            />
          </YStack>
        </XStack>
      </Card>
    </YStack>
  );
}
