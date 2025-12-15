import { Button, type ButtonProps } from "tamagui";

interface GhostButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function GhostButton({ children, ...props }: GhostButtonProps) {
  return (
    <Button
      backgroundColor="transparent"
      borderWidth={0}
      pressStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      hoverStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      focusStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      color="$primary6"
      fontWeight="600"
      size="$4"
      {...props}
    >
      {children}
    </Button>
  );
}
