import { router } from "expo-router";
import { Card, Text, YStack } from "tamagui";

import { GhostButton, PrimaryButton, ScreenContainer } from "@/components/ui";

// TODO: Replace with real AI feedback from backend
const MOCK_FEEDBACK = [
  {
    category: "Pace",
    feedback: "A bit fast. Try pausing between ideas.",
  },
  {
    category: "Filler words",
    feedback: "You used 'um' 7 times. Pause instead.",
  },
  {
    category: "Clarity",
    feedback: "Mostly clear, emphasize key words.",
  },
];

export default function FeedbackScreen() {
  const handleFinish = () => {
    router.replace("/home");
  };

  const handleTryAgain = () => {
    router.replace("/prompt");
  };

  return (
    <ScreenContainer>
      <YStack flex={1} justifyContent="center" gap="$6" paddingHorizontal="$2">
        <YStack alignItems="center" gap="$3">
          <Text fontSize="$9" fontWeight="bold" color="$color">
            Nice work!
          </Text>
          <Text fontSize="$7" color="$blue10" fontWeight="bold">
            Score: 78 / 100
          </Text>
        </YStack>

        <YStack gap="$3">
          {MOCK_FEEDBACK.map((item) => (
            <Card key={item.category} bordered padding="$4" borderRadius="$4">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="bold" color="$color">
                  {item.category}
                </Text>
                <Text fontSize="$4" color="$gray11">
                  {item.feedback}
                </Text>
              </YStack>
            </Card>
          ))}
        </YStack>

        <YStack gap="$3">
          <PrimaryButton onPress={handleFinish}>Finish</PrimaryButton>
          <GhostButton onPress={handleTryAgain}>Try again</GhostButton>
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
