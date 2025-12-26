import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { RadioGroup } from "@/components/ui";

import type { Goal } from "./types";

interface GoalsSectionProps {
  goal: Goal;
  onGoalChange: (value: Goal) => void;
}

/**
 * Goals section with radio group for selecting communication goals
 */
export function GoalsSection({ goal, onGoalChange }: GoalsSectionProps) {
  const { t } = useTranslation();

  const GOALS: { value: Goal; label: string }[] = [
    { value: "sound-confident", label: t("profile.goals.soundConfident") },
    { value: "be-concise", label: t("profile.goals.beConcise") },
    { value: "tough-questions", label: t("profile.goals.toughQuestions") },
  ];

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="bold" color="$color">
        {t("profile.goals.title")}
      </Text>

      <RadioGroup options={GOALS} value={goal} onValueChange={onGoalChange} />
    </YStack>
  );
}
