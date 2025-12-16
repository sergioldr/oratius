import { Button, type ButtonProps } from "tamagui";

type GhostButtonVariant = "default" | "danger";

interface GhostButtonProps extends Omit<ButtonProps, "variant"> {
  children: React.ReactNode;
  variant?: GhostButtonVariant;
}

export function GhostButton({
  children,
  variant = "default",
  ...props
}: GhostButtonProps) {
  return (
    <Button
      backgroundColor="transparent"
      borderWidth={0}
      pressStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      hoverStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      focusStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      color={variant === "danger" ? "$red10" : "$primary6"}
      fontWeight="600"
      size="$4"
      {...props}
    >
      {children}
    </Button>
  );
}
