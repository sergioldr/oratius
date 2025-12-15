import { MaterialIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { Card } from "./card";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const theme = useTheme();

  return (
    <Card variant="elevated">
      <XStack alignItems="center" gap="$3">
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={theme.primary2?.val || "rgba(37, 71, 244, 0.15)"}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialIcons
            name={icon}
            size={20}
            color={theme.primary6?.val || "#2547f4"}
          />
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {title}
          </Text>
          <Text fontSize="$2" color="$gray11" lineHeight="$1">
            {description}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}
