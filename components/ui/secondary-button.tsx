import { Ionicons } from "@expo/vector-icons";
import { Button, type ButtonProps, Text, useTheme } from "tamagui";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface SecondaryButtonProps extends Omit<ButtonProps, "icon" | "children"> {
  children: string;
  icon?: IoniconsName;
  iconPosition?: "left" | "right";
  iconSize?: number;
  textColor?: string;
}

export function SecondaryButton({
  children,
  icon,
  iconPosition = "right",
  iconSize = 20,
  textColor = "$color",
  ...props
}: SecondaryButtonProps) {
  const theme = useTheme();
  const iconColor = theme.color?.val || "#111218";

  return (
    <Button
      size="$6"
      backgroundColor="$buttonBackground"
      borderWidth={1}
      borderColor="transparent"
      pressStyle={{
        backgroundColor: "$buttonBackgroundPress",
        borderColor: "transparent",
      }}
      hoverStyle={{
        backgroundColor: "$buttonBackgroundHover",
        borderColor: "transparent",
      }}
      focusStyle={{
        backgroundColor: "$buttonBackground",
        borderColor: "transparent",
      }}
      borderRadius="$6"
      flexDirection={iconPosition === "left" ? "row" : "row"}
      justifyContent={icon ? "space-between" : "center"}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      )}
      <Text
        fontSize="$4"
        fontWeight="500"
        color={textColor}
        numberOfLines={1}
        flex={icon ? 1 : undefined}
        textAlign={icon ? "left" : "center"}
      >
        {children}
      </Text>
      {icon && iconPosition === "right" && (
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      )}
    </Button>
  );
}
