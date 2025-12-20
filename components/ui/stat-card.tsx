import { Ionicons } from "@expo/vector-icons";
import { Text, XStack, YStack } from "tamagui";

import { Card } from "./card";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  label: string;
  value: string;
}

export function StatCard({
  icon,
  iconColor,
  iconBgColor,
  label,
  value,
}: StatCardProps) {
  return (
    <Card flex={1}>
      <XStack alignItems="center" gap="$3">
        <YStack
          width={40}
          height={40}
          borderRadius="$10"
          backgroundColor={iconBgColor}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </YStack>
        <YStack>
          <Text
            fontSize="$1"
            color="$gray11"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {label}
          </Text>
          <Text fontSize="$5" fontWeight="700" color="$color">
            {value}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}
