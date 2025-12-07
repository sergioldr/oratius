import { router } from "expo-router";
import { useState } from "react";
import { Input, Text, YStack } from "tamagui";

import { PrimaryButton, ScreenContainer } from "@/components/ui";
import { useUser } from "@/context/user-context";

export default function NameScreen() {
  const [name, setName] = useState("");
  const { setName: saveUserName } = useUser();

  const handleContinue = () => {
    saveUserName(name.trim());
    router.push("/goal");
  };

  const isValid = name.trim().length > 0;

  return (
    <ScreenContainer>
      <YStack flex={1} justifyContent="center" gap="$6" paddingHorizontal="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          What should we call you?
        </Text>

        <Input
          size="$5"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          borderRadius="$4"
        />

        <PrimaryButton onPress={handleContinue} disabled={!isValid}>
          Continue
        </PrimaryButton>
      </YStack>
    </ScreenContainer>
  );
}
