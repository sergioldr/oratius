import { MaterialIcons } from "@expo/vector-icons";
import { Button, type ButtonProps, Text, useTheme } from "tamagui";

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

interface SecondaryButtonProps extends Omit<ButtonProps, "icon" | "children"> {
  children: string;
  icon?: MaterialIconName;
  iconPosition?: "left" | "right";
  iconSize?: number;
}

export function SecondaryButton({
  children,
  icon,
  iconPosition = "right",
  iconSize = 20,
  ...props
}: SecondaryButtonProps) {
  const theme = useTheme();
  const iconColor = theme.color?.val || "#111218";

  return (
    <Button
      backgroundColor="$buttonBackground"
      borderWidth={1}
      borderColor="$buttonBorderColor"
      pressStyle={{
        backgroundColor: "$buttonBackgroundPress",
        borderColor: "$buttonBorderColor",
      }}
      hoverStyle={{
        backgroundColor: "$buttonBackgroundHover",
        borderColor: "$borderColorHover",
      }}
      focusStyle={{
        backgroundColor: "$buttonBackground",
        borderColor: "$buttonBorderColor",
      }}
      color="$color"
      borderRadius="$4"
      paddingHorizontal="$5"
      flexDirection={iconPosition === "left" ? "row" : "row"}
      justifyContent={icon ? "space-between" : "center"}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      )}
      <Text
        fontSize="$2"
        fontWeight="500"
        color="$color"
        numberOfLines={1}
        flex={icon ? 1 : undefined}
        textAlign={icon ? "left" : "center"}
      >
        {children}
      </Text>
      {icon && iconPosition === "right" && (
        <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      )}
    </Button>
  );
}
