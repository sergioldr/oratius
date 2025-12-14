import { Button, Text } from "tamagui";

interface ModeButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function ModeButton({ label, selected, onPress }: ModeButtonProps) {
  return (
    <Button
      height={40}
      paddingHorizontal="$4"
      borderRadius="$10"
      backgroundColor={selected ? "$primary6" : "$background"}
      borderWidth={selected ? 0 : 1}
      borderColor="$borderColor"
      pressStyle={{
        scale: 0.98,
        backgroundColor: selected ? "$primary6" : "$background",
      }}
      onPress={onPress}
      shadowColor={selected ? "$primary6" : "transparent"}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={selected ? 0.3 : 0}
      shadowRadius={4}
      elevation={selected ? 2 : 0}
    >
      <Text
        fontSize="$3"
        fontWeight="500"
        color={selected ? "white" : "$gray11"}
      >
        {label}
      </Text>
    </Button>
  );
}
