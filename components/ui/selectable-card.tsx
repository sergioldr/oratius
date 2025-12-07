import { Card, Text, YStack, type CardProps } from "tamagui";

interface SelectableCardProps extends Omit<CardProps, "onPress"> {
  title: string;
  selected?: boolean;
  onPress?: () => void;
}

export function SelectableCard({
  title,
  selected = false,
  onPress,
  ...props
}: SelectableCardProps) {
  return (
    <Card
      bordered
      padding="$4"
      borderRadius="$4"
      backgroundColor={selected ? "$blue2" : "$background"}
      borderColor={selected ? "$blue10" : "$borderColor"}
      borderWidth={selected ? 2 : 1}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      onPress={onPress}
      {...props}
    >
      <YStack alignItems="center" gap="$2">
        <Text
          fontSize="$5"
          fontWeight={selected ? "600" : "400"}
          color={selected ? "$blue10" : "$color"}
        >
          {title}
        </Text>
      </YStack>
    </Card>
  );
}
