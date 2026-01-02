import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { Card, Select, TextInput } from "@/components/ui";

import type { Industry, JobRole, Seniority } from "./types";

interface AboutYouSectionProps {
  name: string;
  jobRole: JobRole;
  industry: Industry;
  seniority: Seniority;
  onNameChange: (value: string) => void;
  onJobRoleChange: (value: JobRole) => void;
  onIndustryChange: (value: Industry) => void;
  onSeniorityChange: (value: Seniority) => void;
  errors?: {
    name?: boolean;
    jobRole?: boolean;
    industry?: boolean;
    seniority?: boolean;
    nameCharacterLimit?: boolean;
  };
}

/**
 * About You section with name, role, industry, and seniority selection
 */
export function AboutYouSection({
  name,
  jobRole,
  industry,
  seniority,
  onNameChange,
  onJobRoleChange,
  onIndustryChange,
  onSeniorityChange,
  errors,
}: AboutYouSectionProps) {
  const { t } = useTranslation();

  const [jobRoleSheetOpen, setJobRoleSheetOpen] = useState(false);
  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [senioritySheetOpen, setSenioritySheetOpen] = useState(false);

  const JOB_ROLES: { value: JobRole; label: string }[] = [
    { value: "engineering", label: t("profile.jobRole.engineering") },
    {
      value: "product-project",
      label: t("profile.jobRole.productProject"),
    },
    { value: "sales", label: t("profile.jobRole.sales") },
    { value: "marketing-pr", label: t("profile.jobRole.marketingPr") },
    {
      value: "customer-success",
      label: t("profile.jobRole.customerSuccess"),
    },
    { value: "support", label: t("profile.jobRole.support") },
    { value: "operations", label: t("profile.jobRole.operations") },
    {
      value: "finance-accounting",
      label: t("profile.jobRole.financeAccounting"),
    },
    { value: "consulting", label: t("profile.jobRole.consulting") },
    { value: "hr-recruiting", label: t("profile.jobRole.hrRecruiting") },
    { value: "healthcare", label: t("profile.jobRole.healthcare") },
    { value: "legal", label: t("profile.jobRole.legal") },
    {
      value: "education-training",
      label: t("profile.jobRole.educationTraining"),
    },
    {
      value: "research-academia",
      label: t("profile.jobRole.researchAcademia"),
    },
    { value: "public-sector", label: t("profile.jobRole.publicSector") },
    {
      value: "people-management",
      label: t("profile.jobRole.peopleManagement"),
    },
    { value: "leadership", label: t("profile.jobRole.leadership") },
    { value: "founder", label: t("profile.jobRole.founder") },
    { value: "creator", label: t("profile.jobRole.creator") },
    { value: "other", label: t("profile.jobRole.other") },
    { value: "prefer-not", label: t("profile.jobRole.preferNot") },
  ];

  const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: "technology", label: t("profile.industry.technology") },
    { value: "finance", label: t("profile.industry.finance") },
    { value: "healthcare", label: t("profile.industry.healthcare") },
    { value: "retail", label: t("profile.industry.retail") },
    { value: "manufacturing", label: t("profile.industry.manufacturing") },
    { value: "consulting", label: t("profile.industry.consulting") },
    { value: "media", label: t("profile.industry.media") },
    { value: "education", label: t("profile.industry.education") },
    { value: "government", label: t("profile.industry.government") },
    { value: "nonprofit", label: t("profile.industry.nonprofit") },
    { value: "other", label: t("profile.industry.other") },
  ];

  const SENIORITIES: { value: Seniority; label: string }[] = [
    { value: "emerging", label: t("profile.seniority.emerging") },
    { value: "junior", label: t("profile.seniority.junior") },
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
        {/* Name */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
            letterSpacing={0.5}
          >
            {t("profile.name.title")}
          </Text>
          <TextInput
            value={name}
            onChangeText={onNameChange}
            placeholder={t("profile.name.placeholder")}
            maxLength={60}
            autoCapitalize="words"
            autoComplete="name"
            error={errors?.name || errors?.nameCharacterLimit}
          />
          {errors?.nameCharacterLimit && (
            <Text fontSize={11} color="$red9" fontWeight="500" marginTop="$1">
              {t("profile.alerts.error.nameCharacterLimit")}
            </Text>
          )}
        </YStack>

        {/* Speaking Role */}
        <YStack gap="$2">
          <Text
            fontSize={11}
            fontWeight="600"
            color="$color"
            letterSpacing={0.5}
          >
            {t("profile.jobRole.title")}
          </Text>

          <Select
            value={jobRole}
            options={JOB_ROLES}
            onValueChange={onJobRoleChange}
            placeholder={t("profile.jobRole.placeholder")}
            open={jobRoleSheetOpen}
            onOpenChange={setJobRoleSheetOpen}
            snapPoints={[75]}
            error={errors?.jobRole}
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
              error={errors?.industry}
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
              error={errors?.seniority}
            />
          </YStack>
        </XStack>
      </Card>
    </YStack>
  );
}
