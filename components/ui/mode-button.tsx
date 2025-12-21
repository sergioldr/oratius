import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button, Text } from "tamagui";

type ModeButtonVariant = "default" | "outlined";

interface ModeButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ModeButtonVariant;
}

export function ModeButton({
  label,
  selected,
  onPress,
  variant = "default",
}: ModeButtonProps) {
  const isOutlined = variant === "outlined";
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getBackgroundColor = () => {
    if (isOutlined) {
      return selected ? "$buttonSelectedBackground" : "$buttonBackground";
    }
    return selected ? "$primary6" : "$buttonBackground";
  };

  const getBorderColor = () => {
    if (isOutlined) {
      return selected ? "$buttonSelectedBorderColor" : "$buttonBorderColor";
    }
    return selected ? "$primary6" : "$buttonBorderColor";
  };

  const getTextColor = () => {
    if (isOutlined && selected) {
      return "$primary6";
    }
    return selected && variant === "default" ? "white" : "$color";
  };

  return (
    <Button
      unstyled
      height={40}
      paddingHorizontal="$4"
      borderRadius="$10"
      backgroundColor={getBackgroundColor()}
      borderWidth={1}
      borderColor={getBorderColor()}
      pressStyle={{
        scale: 0.98,
        backgroundColor: isOutlined
          ? "$buttonBackgroundPress"
          : selected
          ? "$primary6"
          : "$buttonBackgroundPress",
      }}
      onPress={onPress}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="$3" fontWeight="500" color={getTextColor()}>
        {label}
      </Text>
    </Button>
  );
}
