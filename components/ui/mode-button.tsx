import { Button, Text } from "tamagui";

interface ModeButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function ModeButton({ label, selected, onPress }: ModeButtonProps) {
  return (
    <Button
      unstyled
      height={40}
      paddingHorizontal="$4"
      borderRadius="$10"
      backgroundColor={selected ? "$primary6" : "$buttonBackground"}
      borderWidth={selected ? 0 : 1}
      borderColor="$buttonBorderColor"
      pressStyle={{
        scale: 0.98,
        backgroundColor: selected ? "$primary6" : "$buttonBackgroundPress",
      }}
      onPress={onPress}
      shadowColor={selected ? "$primary6" : "transparent"}
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={selected ? 0.3 : 0}
      shadowRadius={8}
      elevation={selected ? 4 : 0}
      alignItems="center"
      justifyContent="center"
    >
      <Text
        fontSize="$3"
        fontWeight="500"
        color={selected ? "white" : "$color"}
      >
        {label}
      </Text>
    </Button>
  );
}
