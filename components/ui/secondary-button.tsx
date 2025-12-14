import { Button, type ButtonProps } from "tamagui";

interface SecondaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function SecondaryButton({ children, ...props }: SecondaryButtonProps) {
  return (
    <Button
      backgroundColor="transparent"
      borderWidth={0}
      pressStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      hoverStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      focusStyle={{ backgroundColor: "transparent", borderWidth: 0 }}
      color="$primary6"
      size="$4"
      {...props}
    >
      {children}
    </Button>
  );
}
