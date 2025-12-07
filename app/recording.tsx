import { router } from "expo-router";
import { Button, Circle, Text, XStack, YStack } from "tamagui";

import { ScreenContainer } from "@/components/ui";

export default function RecordingScreen() {
  // TODO: Implement real audio recording logic here
  // - Request microphone permissions
  // - Start audio recording using expo-av or similar
  // - Track actual recording duration
  // - Handle recording errors

  const handleStop = () => {
    // TODO: Stop recording and save audio file
    router.push("/feedback");
  };

  const handleCancel = () => {
    // TODO: Cancel recording and discard audio
    router.back();
  };

  return (
    <ScreenContainer centered>
      <YStack alignItems="center" gap="$8">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Recording…
        </Text>

        {/* Timer placeholder */}
        <Text fontSize="$10" fontWeight="bold" color="$blue10">
          00:10
        </Text>

        {/* Mic button */}
        <Circle
          size={120}
          backgroundColor="$red10"
          pressStyle={{ scale: 0.95 }}
          animation="quick"
        >
          <Text fontSize="$8" color="$white1">
            🎤
          </Text>
        </Circle>

        {/* Control buttons */}
        <XStack gap="$4" marginTop="$6">
          <Button
            size="$5"
            backgroundColor="$gray6"
            color="$color"
            borderRadius="$4"
            onPress={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="$5"
            backgroundColor="$red10"
            color="$white1"
            borderRadius="$4"
            onPress={handleStop}
          >
            Stop
          </Button>
        </XStack>
      </YStack>
    </ScreenContainer>
  );
}
