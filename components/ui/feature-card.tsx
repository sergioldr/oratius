import { MaterialIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const theme = useTheme();

  return (
    <XStack
      alignItems="center"
      gap="$3"
      backgroundColor="$background"
      padding="$3"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={2}
    >
      <YStack
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor={theme.primary2?.val || "#dbeafe"}
        alignItems="center"
        justifyContent="center"
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={theme.primary6?.val || "#3b82f6"}
        />
      </YStack>
      <YStack flex={1} gap="$1">
        <Text fontSize="$4" fontWeight="600" color="$color">
          {title}
        </Text>
        <Text fontSize="$2" color="$gray10" lineHeight="$1">
          {description}
        </Text>
      </YStack>
    </XStack>
  );
}
