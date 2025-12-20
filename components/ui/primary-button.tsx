import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { Button, type ButtonProps, Text, XStack } from "tamagui";

interface PrimaryButtonProps extends Omit<ButtonProps, "children" | "icon"> {
  children: string;
  iconRight?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
}

export function PrimaryButton({
  children,
  iconRight,
  isLoading,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      backgroundColor="$primary6"
      color="white"
      size="$5"
      borderRadius="$10"
      pressStyle={{
        opacity: 0.9,
        backgroundColor: "$primary6",
        borderColor: "$primary6",
      }}
      disabled={disabled || isLoading}
      shadowColor="$primary6"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.25}
      shadowRadius={8}
      elevation={4}
      {...props}
    >
      <XStack alignItems="center" gap="$2">
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text color="white" fontSize="$5" fontWeight="600">
              {children}
            </Text>
            {iconRight && <Ionicons name={iconRight} size={20} color="white" />}
          </>
        )}
      </XStack>
    </Button>
  );
}
