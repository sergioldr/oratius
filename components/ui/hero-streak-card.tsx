import { Card, Text, YStack } from "tamagui";

import { Icon } from "./icon";

interface HeroStreakCardProps {
  streak: number;
  label: string;
  daysLabel: string;
}

export function HeroStreakCard({
  streak,
  label,
  daysLabel,
}: HeroStreakCardProps) {
  return (
    <Card
      backgroundColor="rgba(34, 197, 94, 0.15)"
      borderRadius="$5"
      padding="$4"
      borderWidth={0}
    >
      <YStack gap="$2" alignItems="center">
        <YStack
          backgroundColor="rgba(34, 197, 94, 0.3)"
          width={48}
          height={48}
          borderRadius={24}
          alignItems="center"
          justifyContent="center"
        >
          <Icon sf={{ default: "flame.fill" }} color="#22c55e" />
        </YStack>
        <YStack alignItems="center" gap="$1">
          <Text
            fontSize="$1"
            fontWeight="600"
            color="#22c55e"
            textTransform="uppercase"
            letterSpacing={1}
          >
            {label}
          </Text>
          <Text fontSize={28} fontWeight="800" color="$color" lineHeight={32}>
            {streak} {daysLabel}
          </Text>
        </YStack>
      </YStack>
    </Card>
  );
}
