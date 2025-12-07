import { router } from "expo-router";
import { useState } from "react";
import { Text, YStack } from "tamagui";

import {
  PrimaryButton,
  ScreenContainer,
  SelectableCard,
} from "@/components/ui";
import { useUser } from "@/context/user-context";

const GOALS = [
  { id: "presentations", label: "Presentations" },
  { id: "interviews", label: "Job interviews" },
  { id: "conversations", label: "Everyday conversations" },
] as const;

type GoalId = (typeof GOALS)[number]["id"];

export default function GoalScreen() {
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null);
  const { setGoal } = useUser();

  const handleContinue = () => {
    if (selectedGoal) {
      setGoal(selectedGoal);
      router.replace("/home");
    }
  };

  return (
    <ScreenContainer>
      <YStack flex={1} justifyContent="center" gap="$6" paddingHorizontal="$2">
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            What do you want to get better at?
          </Text>
          <Text fontSize="$4" color="$gray11">
            {"We'll tailor sessions to your focus."}
          </Text>
        </YStack>

        <YStack gap="$3">
          {GOALS.map((goal) => (
            <SelectableCard
              key={goal.id}
              title={goal.label}
              selected={selectedGoal === goal.id}
              onPress={() => setSelectedGoal(goal.id)}
            />
          ))}
        </YStack>

        <PrimaryButton onPress={handleContinue} disabled={!selectedGoal}>
          Continue
        </PrimaryButton>
      </YStack>
    </ScreenContainer>
  );
}
