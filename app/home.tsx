import { router } from "expo-router";
import { Card, Text, XStack, YStack } from "tamagui";

import { PrimaryButton, ScreenContainer } from "@/components/ui";
import { useUser } from "@/context/user-context";

export default function HomeScreen() {
  const { userData } = useUser();

  const handleStartSession = () => {
    router.push("/prompt");
  };

  return (
    <ScreenContainer>
      <YStack flex={1} gap="$6" paddingTop="$6">
        {/* Greeting */}
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Hi, {userData.name || "there"}
        </Text>

        {/* Stats Row */}
        <XStack gap="$4">
          <Card bordered padding="$3" borderRadius="$4" flex={1}>
            <YStack alignItems="center">
              <Text fontSize="$3" color="$gray11">
                Streak
              </Text>
              <Text fontSize="$6" fontWeight="bold" color="$color">
                0 days
              </Text>
            </YStack>
          </Card>
          <Card bordered padding="$3" borderRadius="$4" flex={1}>
            <YStack alignItems="center">
              <Text fontSize="$3" color="$gray11">
                XP today
              </Text>
              <Text fontSize="$6" fontWeight="bold" color="$color">
                0
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Session Card */}
        <Card
          bordered
          padding="$5"
          borderRadius="$6"
          backgroundColor="$primary2"
          borderColor="$primary4"
        >
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$7" fontWeight="bold" color="$color">
                {"Today's session"}
              </Text>
              <Text fontSize="$4" color="$gray11">
                3 short exercises · ~8 minutes
              </Text>
            </YStack>
            <PrimaryButton onPress={handleStartSession}>
              Start session
            </PrimaryButton>
          </YStack>
        </Card>
      </YStack>
    </ScreenContainer>
  );
}
